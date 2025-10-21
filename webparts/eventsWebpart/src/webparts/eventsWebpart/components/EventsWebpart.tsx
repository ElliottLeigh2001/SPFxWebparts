import * as React from "react";
import { useEffect, useState } from "react";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import styles from "./EventsWebpart.module.scss";
import EventDetails from "./EventDetails";
import { EventItem, IEventsWebpartProps } from "../EventsInterfaces";

const EventsWebpart: React.FC<IEventsWebpartProps> = ({ context }) => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [allItems, setAllItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isAdminOrMember, setIsAdminOrMember] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<Date>()
  const [endDateFilter, setEndDateFilter] = useState<Date>()
  const ITEMS_PER_PAGE = 4;

  // Gets the groups of the logged in user
  const getUserGroups = async (): Promise<void> => {
    try {
      const response = await context.spHttpClient.get(
        `${context.pageContext.web.absoluteUrl}/_api/web/currentuser?$expand=groups`,
        SPHttpClient.configurations.v1
      );
      // Only hr members and owners can add events
      const data = await response.json();
      const userGroups = data.Groups?.map((grp: any) => grp.Title.toLowerCase()) || [];
      const canAddEvents = userGroups.some((group: string) =>
        ['hr-be members', 'hr-be owners'].some((role) => group.includes(role))
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

  const addFilter = (name: string) => {
    setFilters(prev => {
      if (prev.includes(name)) {
        // Remove it if it already exists
        return prev.filter(f => f !== name);
      } else {
        // Add it if it's not there
        return [...prev, name];
      }
    });
  };

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...allItems];

    // Event type filters (if any)
    if (filters.length > 0) {
      filtered = filtered.filter(item => filters.includes((item.EventType || "").toString()));
    }

    // Date range filtering: treat the filters as inclusive on the day.
    // We'll compare the event's StartTime to the provided date range. This shows
    // all events that start on/after the startDate and on/before the endDate.
    if (startDateFilter || endDateFilter) {
      const start = startDateFilter ? startDateFilter : new Date(-8640000000000000);
      // For end date, set to end of day to make it inclusive
      const end = endDateFilter
        ? new Date(endDateFilter.getFullYear(), endDateFilter.getMonth(), endDateFilter.getDate(), 23, 59, 59, 999)
        : new Date(8640000000000000);

      filtered = filtered.filter(item => {
        const eventStart = new Date(item.StartTime);
        return eventStart >= start && eventStart <= end;
      });
    }

    setItems(filtered);
    setCurrentIndex(0);
  }, [filters, startDateFilter, endDateFilter, allItems]);



  // Get data once on mount and filter on upcoming events
  useEffect(() => {
    (async () => {
      await getUserGroups();

      try {
        const listItems = await getListData();
        const now = new Date();
        const upcoming = listItems.filter(item => new Date(item.EndTime) > now);
        setAllItems(upcoming);
        setItems(upcoming);

        // Check URL params for eventId to directly open an event
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get("eventId");

        if (eventId) {
          const selected = upcoming.find(e => e.Id === parseInt(eventId));
          if (selected) {
            setSelectedEvent(selected);
          } else {
            console.warn("No event found for eventId:", eventId);
          }
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Go back to overview when clicking back in the browser
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get("eventId");

      if (eventId) {
        const event = items.find(e => e.Id === parseInt(eventId));
        if (event) {
          setSelectedEvent(event);
        }
      } else {
        setSelectedEvent(null);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [items]);

  // Page to add an event (hr-members and owners only)
  const goToAddPage = (): void => {
    window.location.href = 'https://amexio.sharepoint.com/sites/HR-BE/_layouts/15/listform.aspx?PageType=8&ListId=%7B4E968CFC-746E-4F87-9B81-7E645FC98D2A%7D&RootFolder=%2Fsites%2FHR-BE%2FLists%2FHR_Events&Source=https%3A%2F%2Famexio.sharepoint.com%2Fsites%2FHR-BE%2FLists%2FHR_Events%2FAllItems.aspx%3FnpsAction%3DcreateList&ContentTypeId=0x0100B6E0E24C7650CA40B8A977B7502ABCD000DAA2C47CE81AD74592F8898346A2C7A9'
  }

  // Date formatting because mm/dd/yyyy is stupid
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const pad = (num: number): number | string => (num < 10 ? "0" + num : num);
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
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

  // Show EventDetails if an event is selected
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

  // Event carousel overview
  const visibleItems = items.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
  
  return (
    <div>
      {isAdminOrMember && (
        <p onClick={goToAddPage} className={styles.addButton}>+Add event</p>
      )}
      <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
        <h2>Filters</h2>
      </div>
      <div className={styles.filterContainer}>
        <button className={filters.includes('Standard') ? styles.selectedFilter : styles.filterButton} onClick={() => addFilter('Standard')}>Standard</button>
        <button className={filters.includes('Sinterklaas') ? styles.selectedFilter : styles.filterButton} onClick={() => addFilter('Sinterklaas')}>Sinterklaas</button>
        <button className={filters.includes('Family') ? styles.selectedFilter : styles.filterButton} onClick={() => addFilter('Family')}>Family</button>
        <button className={filters.includes('Staff party') ? styles.selectedFilter : styles.filterButton} onClick={() => addFilter('Staff party')}>Staff party</button>
        <button className={filters.includes('Sport') ? styles.selectedFilter : styles.filterButton} onClick={() => addFilter('Sport')}>Sport</button>
        <button className={filters.includes('No signup') ? styles.selectedFilter : styles.filterButton} onClick={() => addFilter('No signup')}>No signup</button>
        <button 
          className={styles.clearFilters} 
          onClick={() => {
            setFilters([])
            setStartDateFilter(undefined);
            setEndDateFilter(undefined); 
          }}
        >
          Clear</button>
      </div>
      <div className={styles.filterContainer}>
        <label>From:</label>
        <input
          type="date"
          value={startDateFilter ? `${startDateFilter.getFullYear()}-${String(startDateFilter.getMonth()+1).padStart(2,'0')}-${String(startDateFilter.getDate()).padStart(2,'0')}` : ""}
          onChange={(e) => {
            const v = e.target.value;
            setStartDateFilter(v ? new Date(v + 'T00:00:00') : undefined);
          }}
        />
        <label>To:</label>
        <input
          type="date"
          value={endDateFilter ? `${endDateFilter.getFullYear()}-${String(endDateFilter.getMonth()+1).padStart(2,'0')}-${String(endDateFilter.getDate()).padStart(2,'0')}` : ""}
          onChange={(e) => {
            const v = e.target.value;
            setEndDateFilter(v ? new Date(v + 'T00:00:00') : undefined);
          }}
        />
      </div>
      {items.length > 0 ? (
      <div className={styles.eventContainer}>
        {visibleItems.map((item) => {
          const imageData = item.Image0 ? JSON.parse(item.Image0) : null;
          const imageUrl = imageData
            ? `${context.pageContext.web.absoluteUrl}/Lists/HR_Events/Attachments/${item.Id}/${imageData.fileName}`
            : undefined;

          return (
            <div
              key={item.Id}
              className={styles.eventItem}
              onClick={() => {
                setSelectedEvent(item);
                window.history.pushState({}, "", `?eventId=${item.Id}`);
              }}
              style={{ fontSize: 'large' }}
            >
              {imageUrl && <img src={imageUrl} alt={item.Title} className={styles.eventImg} />}
              <div>
                <h4 style={{margin: '10px 0px 10px 0px'}}>{item.Title}</h4>
                <div>📍{item.Location}</div>
                <p style={{margin: '10px 0px 10px 0px'}}>
                <svg style={{marginRight: '5px'}} xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#000"> 
                  <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z"/>
                </svg>{formatDate(item.StartTime)}
                </p>
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
    </div>
  );
};

export default EventsWebpart;
