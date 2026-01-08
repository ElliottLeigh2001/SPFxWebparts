import * as React from "react";
import { useEffect, useState, useRef } from "react";
import styles from "./EventsWebpart.module.scss";
import EventDetails from "./eventDetails/EventDetails";
import { EventItem, IEventsWebpartProps } from "../EventsInterfaces";
import { formatSingleDate, getDateRange } from "../utils/DateUtils";
import HeaderComponent from "./header/HeaderComponent";
import { getListData, getMySubscriptions } from "../service/EventsService";

const EventsWebpart: React.FC<IEventsWebpartProps> = ({ context }) => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [allItems, setAllItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);
  const dateDropdownRef = useRef<HTMLDivElement | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [myEventIds, setMyEventIds] = useState<number[]>([]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      
      if (width >= 1400) {
        setItemsPerPage(6); // 3x2 grid
      } else if (width >= 1100) {
        setItemsPerPage(4) // 2x2 grid
      }
    };

    updateItemsPerPage();

    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Close dropdowns when clicking outside them (but not when clicking inside)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (typeDropdownOpen && typeDropdownRef.current && !typeDropdownRef.current.contains(target)) {
        setTypeDropdownOpen(false);
      }

      if (dateDropdownOpen && dateDropdownRef.current && !dateDropdownRef.current.contains(target)) {
        setDateDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [typeDropdownOpen, dateDropdownOpen]);

  // All event types. They could be obtained dynamically through an API call
  // But if any new event types were made, they would be useless until a new
  // Form was created anyway
  const eventTypes: Record<string, string> = {
    "MyEvents": "My Registrations",
    "Standard": "Basic events",
    "Sinterklaas": "Sinterklaas",
    "Family": "Family",
    "Staff party": "Staff party",
    "Sport": "Sport",
    "No signup": "No signup",
    "Custom": "Others"
  };

  const dateRanges: Record<string, string> = {
    today: "Today",
    thisWeek: "This week",
    nextWeek: "Next week",
    thisMonth: "This month"
  };

  // Add an event type to filter on
  const addFilter = (name: string) => {
    setFilters((prev) =>
      // If the filter is already in the list, remove it
      prev.includes(name)
        ? prev.filter((f) => f !== name)
        // Otherwise add it to the list
        : [...prev, name]
    );
  };

  // Apply filters whenever they change or when myEventIds changes
  useEffect(() => {
    let filtered = [...allItems];

    // event-type filters (exclude MyEvents from this filtering)
    const realTypeFilters = filters.filter(f => f !== "MyEvents");

    if (realTypeFilters.length > 0) {
      filtered = filtered.filter((item) =>
        realTypeFilters.includes((item.EventTypes || "").toString())
      );
    }

    // search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.Title?.toLowerCase().includes(q) ||
        item.Beschrijving?.toLowerCase().includes(q) 
      );
    }

    // My Events category filter
    const myEventsSelected = filters.includes("MyEvents");

    if (myEventsSelected) {
      filtered = filtered.filter((item) =>
        myEventIds.includes(item.Id!)
      );
    }

    // Date range filter
    if (dateRangeFilter) {
      const range = getDateRange(dateRangeFilter);
      if (range) {
        filtered = filtered.filter((item) => {
          const eventStart = new Date(item.StartTime);
          return eventStart >= range.start && eventStart <= range.end;
        });
      }
    }

    setItems(filtered);
    setCurrentIndex(0);
  }, [filters, dateRangeFilter, allItems, searchQuery, myEventIds]);

  // On mount: fetch events, user groups, and subscriptions
  useEffect(() => {
    (async () => {
      try {
        const listItems = await getListData(context);
        const now = new Date();
        const upcoming = listItems.filter((item) => {
          const end = new Date(item.EndTime);
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          return endOfDay > now;
        });
        setAllItems(upcoming);

        const eventIds = await getMySubscriptions(context);
        setMyEventIds(eventIds);

        // Initially, items = all (unless showMyEvents is true, then the effect above will re-filter)
        setItems(upcoming);

        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("eventId");

        if (eventId) {
          const selected = upcoming.find(
            (e) => e.Id === parseInt(eventId)
          );
          if (selected) setSelectedEvent(selected);
        }

      } catch (err) {
        console.error("Error fetching events or subscriptions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get("eventId");

      if (eventId) {
        const event = items.find((e) => e.Id === parseInt(eventId));
        if (event) setSelectedEvent(event);
      } else {
        setSelectedEvent(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [items]);

  // Carousel arrows logic
  const handlePrev = (): void => {
    setCurrentIndex((prev) => Math.max(prev - itemsPerPage, 0));
  };
  const handleNext = (): void => {
    const maxStart = Math.max(0, (totalPages - 1) * itemsPerPage);
    setCurrentIndex((prev) => Math.min(prev + itemsPerPage, maxStart));
  };

  if (loading) return <div>Loading events...</div>;
  if (selectedEvent) {
    return (
      <EventDetails
        context={context}
        event={selectedEvent}
        onBack={() => {
          setSelectedEvent(null);
          window.history.pushState({}, "", window.location.pathname);
        }}
      />
    );
  }

  const truncate = (text: string, length: number) => {
    return text.length > length ? text.slice(0, length) + "..." : text;
  }
  
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const pageIndex = Math.floor(currentIndex / itemsPerPage);
  
  return (
    <>
    <div>
      <HeaderComponent/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=search" />

      <div className={styles.layout}>
        <div className={styles.filtersContainer}>
          <aside className={styles.filters}>
            <div className={styles.leftFilters}>
              <div className={styles.dropdown} ref={typeDropdownRef}>
                <button
                  className={styles.dropdownToggle}
                  onClick={() => {setTypeDropdownOpen(!typeDropdownOpen); setDateDropdownOpen(false);}}
                  >
                  <span>Category</span>
                  <svg
                    className={styles.arrow}
                    fill="#b1b0b0"
                    viewBox="0 0 30.727 30.727"
                    >
                    <path d="M29.994,10.183L15.363,24.812L0.733,10.184c-0.977-0.978-0.977-2.561,0-3.536
                      c0.977-0.977,2.559-0.976,3.536,0l11.095,11.093L26.461,6.647
                      c0.977-0.976,2.559-0.976,3.535,0C30.971,7.624,30.971,9.206,29.994,10.183z" />
                  </svg>
                </button>

                {typeDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {Object.entries(eventTypes).map(([key, label]) => (
                      <label key={key} className={styles.dropdownItem}>
                        <input
                          type="checkbox"
                          checked={filters.includes(key)}
                          onChange={() => addFilter(key)}
                          />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.dropdown} ref={dateDropdownRef}>
                <button
                  className={styles.dropdownToggle}
                  onClick={() => {setDateDropdownOpen(!dateDropdownOpen); setTypeDropdownOpen(false);}}
                  >
                  <span>
                    {dateRangeFilter ? dateRanges[dateRangeFilter] : "Date range"}
                  </span>
                  <svg
                    className={styles.arrow}
                    fill="#b1b0b0"
                    viewBox="0 0 30.727 30.727"
                    >
                    <path d="M29.994,10.183L15.363,24.812L0.733,10.184c-0.977-0.978-0.977-2.561,0-3.536
                    c0.977-0.977,2.559-0.976,3.536,0l11.095,11.093L26.461,6.647
                    c0.977-0.976,2.559-0.976,3.535,0C30.971,7.624,30.971,9.206,29.994,10.183z" />
                  </svg>
                </button>

                {dateDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {Object.entries(dateRanges).map(([key, label]) => (
                      <label
                      key={key}
                      className={styles.dropdownItem}
                      onClick={() => {
                        setDateRangeFilter(key);
                        setDateDropdownOpen(false);
                      }}
                      >
                        <input
                          type="radio"
                          name="date-range"
                          checked={dateRangeFilter === key}
                          readOnly
                          />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className={styles.rightFilters}>
              <div className={styles.searchBar}>
                <svg
                  className={styles.searchIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#b1b0b0"
                  >
                <path d="M21.707 20.293l-4.823-4.823A7.931 7.931 0 0018 10a8 8 0 10-8 8 7.931 7.931 0 005.47-1.116l4.823 4.823a1 1 0 001.414-1.414zM4 10a6 6 0 1112 0 6 6 0 01-12 0z"/>
              </svg>
                <input
                  type="text"
                  placeholder="Search event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  />
              </div>

              <button
                className={styles.clearFilters}
                onClick={() => {
                  setFilters([]);
                  setSearchQuery("");
                  setDateRangeFilter("");
                  setDateDropdownOpen(false);
                  setTypeDropdownOpen(false);
                }}
              >
                Clear All
              </button>
            </div>
          </aside>
        </div>
      </div>

        <main className={styles.mainContent}>

          {items.length > itemsPerPage && (
            <div className={styles.carouselControls}>
              <div>
                <button onClick={handlePrev} disabled={pageIndex === 0}>
                  <svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M12.35 15.85a.5.5 0 0 1-.7 0L6.16 10.4a.55.55 0 0 1 0-.78l5.49-5.46a.5.5 0 1 1 .7.7L7.2 10l5.16 5.15c.2.2.2.5 0 .7Z"></path></svg>
                </button>
              </div>
            </div>
          )}

          {items.length > 0 ? (
            <div className={styles.eventViewport}>
              <div
                className={styles.track}
                style={{ transform: `translateX(-${pageIndex * 100}%)` }}
              >
                {Array.from({ length: totalPages }).map((_, p) => {
                  const pageItems = items.slice(
                    p * itemsPerPage,
                    p * itemsPerPage + itemsPerPage
                  );

                  return (
                    <div className={styles.page} key={p}>
                      {pageItems.map((item) => {
                        const imageData = item.Image0
                          ? JSON.parse(item.Image0)
                          : null;
                        const imageUrl = imageData
                          ? `${context.pageContext.web.absoluteUrl}/Lists/HR_Events/Attachments/${item.Id}/${imageData.fileName}`
                          : undefined;
                      return (
                        <div
                          key={item.Id}
                          className={styles.eventItem}
                          onClick={() => {
                            setSelectedEvent(item);
                            window.history.pushState(
                              {},
                              "",
                              `?eventId=${item.Id}`
                            );
                          }}
                        >
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={item.Title}
                              className={styles.eventImg}
                            />
                          )}
                        <div className={styles.eventContent}>
                          <p className={styles.eventTitle}><strong>{truncate(item.Title, 50)}</strong></p>
                          <p className={styles.eventDate}>{formatSingleDate(item.StartTime)}</p>
                          <p className={styles.eventLocation}>{truncate(item.Location, 30)}</p>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              </div>
            </div>
          ) : (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              {(filters.length > 0 || searchQuery !== null) ? (
                <h3>There are no events that meet the filter criteria</h3>
              ) : (
                <h3>There are no upcoming events</h3>
              )}
            </div>
          )}

          {items.length > itemsPerPage && (
            <div className={styles.carouselControls}>
              <div>
                <button
                  onClick={handleNext}
                  disabled={pageIndex >= totalPages - 1}
                >
                  <svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7.65 4.15c.2-.2.5-.2.7 0l5.49 5.46c.21.22.21.57 0 .78l-5.49 5.46a.5.5 0 0 1-.7-.7L12.8 10 7.65 4.85a.5.5 0 0 1 0-.7Z"></path></svg>
                </button>
              </div>
            </div>
          )}

        </main>
          {totalPages > 1 && (
            <div className={styles.pagination}>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - (pageIndex + 1)) <= 1
                  );
                })
                .reduce((acc: (number | string)[], page, index, filtered) => {
                  if (index > 0 && page - (filtered[index - 1] as number) > 1) {
                    acc.push("…");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((page, i) =>
                  page === "…" ? (
                    <span key={`ellipsis-${i}`}>…</span>
                  ) : (
                  <button
                    key={page}
                    className={`${styles.pageNumber} ${
                      pageIndex + 1 === page ? styles.activePage : ""
                    }`}
                    onClick={() => {
                      if (typeof page === "number") {
                        setCurrentIndex((page - 1) * itemsPerPage);
                      }
                    }}
                  >
                    {page}
                  </button>
                  )
                )}

            </div>
          )}
      </div>
    </>
  );
};

export default EventsWebpart;
