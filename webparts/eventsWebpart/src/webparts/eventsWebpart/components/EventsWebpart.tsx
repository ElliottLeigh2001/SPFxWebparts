import * as React from "react";
import { useEffect, useState } from "react";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import styles from "./EventsWebpart.module.scss";
import EventDetails from "./eventDetails/EventDetails";
import { EventItem, IEventsWebpartProps } from "../EventsInterfaces";
import { formatSingleDate } from "../utils/DateUtils";

const EventsWebpart: React.FC<IEventsWebpartProps> = ({ context }) => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [allItems, setAllItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isAdminOrMember, setIsAdminOrMember] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<Date>();
  const [endDateFilter, setEndDateFilter] = useState<Date>();

  // The amount of events to show at one time
  const ITEMS_PER_PAGE = 4;

  // All event types. They could be obtained dynamically through an API call
  // But if any new event types were made, they would be useless untill a new
  // Form was created anyway
  const eventTypes = [
    "Standard",
    "Sinterklaas",
    "Family",
    "Staff party",
    "Sport",
    "No signup",
  ];

  // Gets the groups of the logged in user
  const getUserGroups = async (): Promise<void> => {
    try {
      const response = await context.spHttpClient.get(
        `${context.pageContext.web.absoluteUrl}/_api/web/currentuser?$expand=groups`,
        SPHttpClient.configurations.v1
      );
      const data = await response.json();
      // If the user is a member or owner of the site, they can make a new event
      const userGroups =
        data.Groups?.map((grp: any) => grp.Title.toLowerCase()) || [];
      const canAddEvents = userGroups.some((group: string) =>
        ["hr-be members", "hr-be owners"].some((role) =>
          group.includes(role)
        )
      );
      setIsAdminOrMember(canAddEvents);
    } catch (err) {
      console.error("Error checking group membership:", err);
    }
  };

  // Fetch events from SharePoint list HR_Events
  const getListData = async (): Promise<EventItem[]> => {
    const response: SPHttpClientResponse = await context.spHttpClient.get(
      `${context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('HR_Events')/items?$select=Id,Title,Image0,StartTime,EndTime,FoodEvent,Beschrijving,Location,Signinlink,EventType,SignupDeadline,PlusOne,Carpooling&$orderby=StartTime asc`,
      SPHttpClient.configurations.v1
    );
    const data = await response.json();
    return data.value as EventItem[];
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

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...allItems];

    // Event type filters (if any)
    if (filters.length > 0) {
      filtered = filtered.filter(item => filters.includes((item.EventType || "").toString()));
    }

    // Date range filtering
    // Compare the event's StartTime to the date range
    // Shows all events that start on/after the startDate and on/before the endDate
    if (startDateFilter || endDateFilter) {
      const start = startDateFilter ? startDateFilter : new Date(-8640000000000000);
      // For end date, set to end of day to make it inclusive (hence the 8640000000000000)
      const end = endDateFilter
        ? new Date(endDateFilter.getFullYear(), endDateFilter.getMonth(), endDateFilter.getDate(), 23, 59, 59, 999)
        : new Date(8640000000000000);

      filtered = filtered.filter(item => {
        const eventStart = new Date(item.StartTime);
        return eventStart >= start && eventStart <= end;
      });
    }

    setItems(filtered);
    // Reset pagination index to prevent bugginess
    setCurrentIndex(0);
  }, [filters, startDateFilter, endDateFilter, allItems]);

  // Get events and user data once on mount
  useEffect(() => {
    (async () => {
      await getUserGroups();

      try {
        const listItems = await getListData();
        const now = new Date();
        // Only get events that are in the future
        const upcoming = listItems.filter(
          (item) => new Date(item.EndTime) > now
        );
        // Set them twice (used for filtering)
        setAllItems(upcoming);
        setItems(upcoming);

        // If URL contains eventId → open event directly
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("eventId");

        if (eventId) {
          const selected = upcoming.find(
            (e) => e.Id === parseInt(eventId)
          );
          if (selected) setSelectedEvent(selected);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
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

  // Redirects to the add form (only visible for hr members and owners)
  const goToAddPage = (): void => {
    window.location.href =
      "https://amexio.sharepoint.com/sites/HR-BE/_layouts/15/listform.aspx?PageType=8&ListId=%7B4E968CFC-746E-4F87-9B81-7E645FC98D2A%7D&RootFolder=%2Fsites%2FHR-BE%2FLists%2FHR_Events&Source=https%3A%2F%2Famexio.sharepoint.com%2Fsites%2FHR-BE%2FLists%2FHR_Events%2FAllItems.aspx%3FnpsAction%3DcreateList&ContentTypeId=0x0100B6E0E24C7650CA40B8A977B7502ABCD000DAA2C47CE81AD74592F8898346A2C7A9";
  };

  // Carousel arrows logic
  const handlePrev = (): void => {
    setCurrentIndex((prev) => Math.max(prev - ITEMS_PER_PAGE, 0));
  };
  const handleNext = (): void => {
    setCurrentIndex((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, items.length - ITEMS_PER_PAGE)
    );
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

  const visibleItems = items.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
  
  return (
    <>
    <div className={styles.pageHeader}>
      
      {isAdminOrMember && (
        <p onClick={goToAddPage} className={styles.addButton}>
          + Add event
        </p>
      )}
    </div>

      <div className={styles.layout}>
        <div className={styles.sidebarContainer}>
          <aside className={styles.sidebar}>
            <h2 style={{margin: '0px 0px 20px 0px'}}>Filters</h2>
            <div className={styles.filterGroup}>
              <h3>Event Types</h3>
              {eventTypes.map((type) => (
                <div className={styles.filterCheckbox}>
                  <label key={type} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters.includes(type)}
                      onChange={() => addFilter(type)}
                    />
                    {type}
                  </label>
                </div>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h3>Date Range</h3>
              <div className={styles.dateInputRow}>
                <label className={styles.dateLabel}>From:</label>
                <input
                  type="date"
                  value={startDateFilter ? `${startDateFilter.getFullYear()}-${String(startDateFilter.getMonth()+1).padStart(2,'0')}-${String(startDateFilter.getDate()).padStart(2,'0')}` : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartDateFilter(v ? new Date(v + 'T00:00:00') : undefined);
                  }}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateInputRow}>
                <label className={styles.dateLabel}>To:</label>
                <input
                  type="date"
                  value={endDateFilter ? `${endDateFilter.getFullYear()}-${String(endDateFilter.getMonth()+1).padStart(2,'0')}-${String(endDateFilter.getDate()).padStart(2,'0')}` : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEndDateFilter(v ? new Date(v + 'T00:00:00') : undefined);
                  }}
                  className={styles.dateInput}
                />
              </div>
            </div>

            <button
              className={styles.clearFilters}
              onClick={() => {
                setFilters([]);
                setStartDateFilter(undefined);
                setEndDateFilter(undefined);
              }}
            >
              Clear All
            </button>
          </aside>
        </div>

        <main className={styles.mainContent}>

          {items.length > 0 ? (
            <div className={styles.eventContainer}>
              {visibleItems.map((item) => {
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
                    <div>
                      <h4>{item.Title}</h4>
                      <div>📍{item.Location}</div>
                      <p>{formatSingleDate(item.StartTime)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>There are no upcoming events</p>
          )}

          {items.length > ITEMS_PER_PAGE && (
            <div className={styles.carouselControls}>
              <button onClick={handlePrev} disabled={currentIndex === 0}>
                &#10094;
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex + ITEMS_PER_PAGE >= items.length}
              >
                &#10095;
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default EventsWebpart;
