import * as React from "react";
import { useEffect, useState } from "react";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import styles from "./EventsWebpart.module.scss";
import EventDetails from "./EventDetails";
import { EventItem, IEventsWebpartProps } from "../EventsInterfaces";
import { LocationFilled } from "@fluentui/react-icons";

const EventsWebpart: React.FC<IEventsWebpartProps> = ({ context }) => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isAdminOrMember, setIsAdminOrMember] = useState(false);

  const ITEMS_PER_PAGE = 4;

  // Gets the groups of the logged in user
  const getUserGroups = async (): Promise<void> => {
    try {
      const response = await context.spHttpClient.get(
        `${context.pageContext.web.absoluteUrl}/_api/web/currentuser?$expand=groups`,
        SPHttpClient.configurations.v1
      );
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
      `${context.pageContext.web.absoluteUrl}/_api/web/lists/GetByTitle('HR_Events')/items?$select=Id,Title,Image0,StartTime,EndTime,FoodEvent,Beschrijving,Location`,
      SPHttpClient.configurations.v1
    );
    const data = await response.json();
    return data.value as EventItem[];
  };

  // Get data once on mount and filter on upcoming events
  useEffect(() => {
    (async () => {
      await getUserGroups();

      try {
        const listItems = await getListData();
        const now = new Date();
        const upcoming = listItems.filter(item => new Date(item.EndTime) > now);
        setItems(upcoming);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        onBack={() => setSelectedEvent(null)}
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
      {items.length > 0 ? (
      <div className={styles.eventContainer}>
        {visibleItems.map((item) => {
          const locationData = item.Location ? JSON.parse(item.Location) : null; 
          const locationName = locationData?.DisplayName || "Unknown location";
          const imageData = item.Image0 ? JSON.parse(item.Image0) : null;
          const imageUrl = imageData
            ? `${context.pageContext.web.absoluteUrl}/Lists/HR_Events/Attachments/${item.Id}/${imageData.fileName}`
            : undefined;

          return (
            <div
              key={item.Id}
              className={styles.eventItem}
              onClick={() => setSelectedEvent(item)}
              style={{ fontSize: 'large' }}
            >
              {imageUrl && <img src={imageUrl} alt={item.Title} className={styles.eventImg} />}
              <h3>{item.Title}</h3>
              <div><LocationFilled /> {locationName}</div>
              <p>{formatDate(item.StartTime)}</p>
              <p style={{ color: item.FoodEvent ? "green" : "gray" }}>
                {item.FoodEvent ? "Food Included" : ""}
              </p>
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
