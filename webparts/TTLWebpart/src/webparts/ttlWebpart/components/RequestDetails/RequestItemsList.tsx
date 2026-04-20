import * as React from 'react';
import { useState, useMemo } from 'react';
import { IUserRequestItem } from '../../Interfaces/TTLInterfaces';
import requestDetailsStyles from './RequestDetails.module.scss';
import formStyles from '../Forms/Forms.module.scss';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { formatDate } from '../../Helpers/HelperFunctions';
import { IRequestItemsListProps } from './RequestDetailsProps';
import { FilePicker, IFilePickerResult } from '@pnp/spfx-controls-react/lib/FilePicker';
import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import { getDocumentsForRequestItem } from '../../service/TTLService';

const RequestItemsList: React.FC<IRequestItemsListProps> = ({
    items,
    onEdit,
    onDelete,
    onAdd,
    showActions,
    request,
    view,
    context,
}) => {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['Software', 'Training', 'Travel', 'Accommodation']));
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadDocs, setDownloadDocs] = useState<Array<{ id: number; url: string; name: string }>>([]);
  const [downloadLoadingForItem, setDownloadLoadingForItem] = useState<number | null>(null);
  const [downloadDialogTitle, setDownloadDialogTitle] = useState<string>('');

  // Group items by request type
  const groupedItems = useMemo(() => {
      const groups: { [key: string]: IUserRequestItem[] } = {};
      items.forEach(item => {
          const type = item.RequestType || 'Other';
          if (!groups[type]) {
              groups[type] = [];
          }
          groups[type].push(item);
      });
      return groups;
  }, [items]);

  // Toggle collapse/expand for a type
  const toggleTypeExpanded = (type: string) => {
      const newSet = new Set(expandedTypes);
      if (newSet.has(type)) {
          newSet.delete(type);
      } else {
          newSet.add(type);
      }
      setExpandedTypes(newSet);
  };

  const getSP = (context: any): SPFI => {
      return spfi(context.pageContext.web.absoluteUrl).using(SPFx(context));
  };

  // Parse UsersLicense to show all users in a single string
  const getUsersLicenseDisplay = (usersLicense: any[] | undefined): string => {
    if (!usersLicense || !Array.isArray(usersLicense) || usersLicense.length === 0) {
        return '-';
    }

    const people = usersLicense.map(user => user.Title);

    return people.join(', ');
  };

  const openDownloadDialog = async (item: IUserRequestItem) => {
      if (!context || !item.ID) return;

      setDownloadLoadingForItem(item.ID);
      setDownloadDialogTitle(item.Title || '');

      try {
          const docs = await getDocumentsForRequestItem(context, item.ID);
          setDownloadDocs(docs);
          setDownloadDialogOpen(true);
      } catch (error) {
          console.error('Error fetching attached documents:', error);
      } finally {
          setDownloadLoadingForItem(null);
      }
  };

  const closeDownloadDialog = () => {
      setDownloadDialogOpen(false);
      setDownloadDocs([]);
      setDownloadDialogTitle('');
  };

  const downloadDocument = async (doc: { url: string; name: string }) => {
      if (!context || !doc.url) return;

      const sp = getSP(context);
      const file = sp.web.getFileById(doc.url);

      try {
          const blob = await file.getBlob();
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = doc.name || 'download';
          a.click();

          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      } catch (error) {
          console.error('Error downloading document:', error);
      }
  };

  // Upload and associate document with request item 
  const onFilePickerSave = async (filePickerResult: IFilePickerResult[], requestItemId: number) => {
    if (!filePickerResult?.length || !context) return;

    const sp = getSP(context);

    for (const pickerItem of filePickerResult) {
      try {
        const fileContent = await pickerItem.downloadFileContent();
        const fileName = pickerItem.fileName;

        // Upload file to library (folder path is relative to the current web)
        const uploadResult: any = await sp.web
          .getFolderByServerRelativePath("TTL_Documents")
          .files.addUsingPath(fileName, fileContent, { Overwrite: true });

        // uploadResult *contains* file metadatal,
        // but it may not contain PnPjs methods. Get server relative url from it:
        const serverRelativeUrl: string = uploadResult?.ServerRelativeUrl || null;

        // Now ask PnPjs for a file object that has the helper methods
        const fileObj = sp.web.getFileByServerRelativePath(serverRelativeUrl);

        // Try to get the list item for the file 
        // Sometimes the list item is not immediately available, so we attempt a few retries with small delays
        const maxAttempts = 6;
        let fileListItem: any = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Get metadata associated with the file
            fileListItem = await fileObj.listItemAllFields();
            if (fileListItem && fileListItem.Id) break;
          } catch (err) {
            console.warn(`[Upload] attempt ${attempt} to get list item failed`, err);
          }
          // Wait before next attempt
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }

        if (!fileListItem || !fileListItem.Id) {
          console.error("[Upload] could not get the uploaded file's list item after retries. uploadResult:", uploadResult);
          continue;
        }

        const documentItemId = fileListItem.Id;

        // Update both sides of the lookup relationship
        const reqList = sp.web.lists.getByTitle("TTL_RequestItem");
        const docList = sp.web.lists.getByTitle("TTL_Documents");

        await Promise.all([
          reqList.items.getById(requestItemId).update({
            DocumentIDId: documentItemId,
          }),
          docList.items.getById(documentItemId).update({
            RequestItemIDId: requestItemId,
            url: `${uploadResult.UniqueId}`
          }),
        ]);

        window.location.reload();

      } catch (error) {
        console.error("Error uploading or linking document:", error);
      }
    }
  };

  // For each request item in the request, render a card with the appropriate fields
  const renderItemCard = (item: IUserRequestItem) => {
      return (
          <>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
          <div
              key={item.ID}
              className={requestDetailsStyles.requestCard}
          >
              <div className={formStyles.cardHeader}>
                  <div className={formStyles.cardTitle}>
                      <i className={requestDetailsStyles.typeIcon}></i>
                      <h3>{item.Title}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', height: '30px' }}>
                      {showActions && (
                          <div className={requestDetailsStyles.cardActions}>
                              <i className="fa fa-pencil" onClick={() => onEdit(item)} />
                              {(request.RequestStatus === 'Draft' || request.RequestStatus === 'Rejected') && (
                                  <i className="fa fa-trash-o" onClick={() => onDelete(item)} />
                              )}
                          </div>
                      )}

                  <div className={requestDetailsStyles.actionButtons}>
                      {request.RequestStatus === 'Completed' && (
                          <button className={requestDetailsStyles.iconButtonDocument} title="Provide document with proof of payment">
                              <i className="fa fa-upload" aria-hidden="true"></i>

                              <FilePicker
                                  context={context as any}
                                  accepts={[".pdf", ".docx", ".xlsx", ".msg", ".eml", ".jpg", ".png"]}
                                  onSave={(files) => onFilePickerSave(files, item.ID!)}
                                  hideSiteFilesTab={true}
                                  hideStockImages={true}
                                  hideOneDriveTab={true}
                                  hideOrganisationalAssetTab={true}
                                  hideWebSearchTab={true}
                                  hideLocalUploadTab={true}
                                  hideLocalMultipleUploadTab={false}
                                  hideLinkUploadTab={true}
                                  hideRecentTab={true}
                                  buttonIcon="FileAdd"
                              />
                          </button>
                      )}

                      {item.DocumentID?.Id && (
                          <button
                              className={requestDetailsStyles.iconButtonDocument}
                              title="Download Document"
                              disabled={downloadLoadingForItem === item.ID}
                              onClick={async () => {
                                  try {
                                      await openDownloadDialog(item);
                                  } catch (err) {
                                      console.error('Error opening document dialog:', err);
                                  }
                              }}
                          >
                              <i className="fa-solid fa-download"></i>
                          </button>
                      )}
                  </div>


                  </div>
              </div>

              <div className={requestDetailsStyles.cardContent}>

                  <div className={requestDetailsStyles.fieldGroup}>
                      <span className={requestDetailsStyles.fieldLabel}>Cost:</span>
                      <span className={requestDetailsStyles.fieldValue}>€ {item.Cost || '0'}</span>
                  </div>

                  {item.Provider && (
                      <div className={requestDetailsStyles.fieldGroup}>
                          <span className={requestDetailsStyles.fieldLabel}>Provider:</span>
                          <span className={requestDetailsStyles.fieldValue}>{item.Provider}</span>
                      </div>
                  )}

                  {item.RequestType === 'Software' && (
                      <>
                          {item.Licensing && (
                              <div className={requestDetailsStyles.fieldGroup}>
                                  <span className={requestDetailsStyles.fieldLabel}>Licensing:</span>
                                  <span className={requestDetailsStyles.fieldValue}>{item.Licensing}</span>
                              </div>
                          )}
                          {item.LicenseType && (
                              <div className={requestDetailsStyles.fieldGroup}>
                                  <span className={requestDetailsStyles.fieldLabel}>License Type:</span>
                                  <span className={requestDetailsStyles.fieldValue}>{item.LicenseType}</span>
                              </div>
                          )}
                          {item.UsersLicense && item.UsersLicense.length > 0 && (
                              <div className={requestDetailsStyles.fieldGroup}>
                              <span className={requestDetailsStyles.fieldLabel}>Users:</span>
                              <span className={requestDetailsStyles.fieldValue}>{getUsersLicenseDisplay(item.UsersLicense)}</span>
                              </div>
                          )}
                      </>
                  )}

                  {item.RequestType !== 'Software' && (
                      <>
                          {item.Location && (
                              <div className={requestDetailsStyles.fieldGroup}>
                                  <span className={requestDetailsStyles.fieldLabel}>Location:</span>
                                  <span className={requestDetailsStyles.fieldValue}>{item.Location}</span>
                              </div>
                          )}
                          {item.LocationFrom && (
                              <div className={requestDetailsStyles.fieldGroup}>
                                  <span className={requestDetailsStyles.fieldLabel}>From:</span>
                                  <span className={requestDetailsStyles.fieldValue}>{item.LocationFrom}</span>
                              </div>
                          )}
                          {item.LocationTo && (
                              <div className={requestDetailsStyles.fieldGroup}>
                                  <span className={requestDetailsStyles.fieldLabel}>To:</span>
                                  <span className={requestDetailsStyles.fieldValue}>{item.LocationTo}</span>
                              </div>
                          )}
                          {item.StartDate && (
                              <div className={requestDetailsStyles.fieldGroup}>
                                  <span className={requestDetailsStyles.fieldLabel}>Start Date:</span>
                                  <span className={requestDetailsStyles.fieldValue}>{formatDate(new Date(item.StartDate))}</span>
                              </div>
                          )}
                          {item.OData__EndDate && (
                              <div className={requestDetailsStyles.fieldGroup}>
                                  <span className={requestDetailsStyles.fieldLabel}>End Date:</span>
                                  <span className={requestDetailsStyles.fieldValue}>{formatDate(new Date(item.OData__EndDate))}</span>
                              </div>
                          )}
                      </>
                  )}

                  {item.Link && (
                      <div className={requestDetailsStyles.fieldGroup}>
                          <span className={requestDetailsStyles.fieldLabel}>Link:</span>
                          <a href={item.Link} target="_blank" rel="noopener noreferrer" className={requestDetailsStyles.link}>
                              {item.Link.length > 80 ? `${item.Link.substring(0, 80)}...` : item.Link}
                          </a>
                      </div>
                  )}
              </div>
          </div>
      </>
      );
  };

  const renderDownloadDialog = () => {
      if (!downloadDialogOpen) return null;

      return (
          <div className={requestDetailsStyles.downloadDialogOverlay}>
              <div className={requestDetailsStyles.downloadDialog} role="dialog" aria-modal="true" aria-label="Download documents">
                  <div className={requestDetailsStyles.downloadDialogHeader}>
                      <h3>Download documents{downloadDialogTitle ? ` for ${downloadDialogTitle}` : ''}</h3>
                      <button
                          type="button"
                          className={requestDetailsStyles.downloadDialogClose}
                          onClick={closeDownloadDialog}
                          aria-label="Close"
                      >
                          ✕
                      </button>
                  </div>
                  <div className={requestDetailsStyles.downloadDialogBody}>
                      {downloadDocs.length === 0 ? (
                          <p>No documents found for this item.</p>
                      ) : (
                          <ul className={requestDetailsStyles.downloadDialogList}>
                              {downloadDocs.map(doc => (
                                  <li key={doc.id} className={requestDetailsStyles.downloadDialogItem}>
                                      <span className={requestDetailsStyles.downloadDialogItemName}>{doc.name}</span>
                                      <button
                                          type="button"
                                          className={requestDetailsStyles.downloadDialogItemButton}
                                          onClick={() => downloadDocument(doc)}
                                      >
                                          Download
                                      </button>
                                  </li>
                              ))}
                          </ul>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
      <>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        {renderDownloadDialog()}
          {items.length > 0 ? (
              Object.keys(groupedItems).map(type => (
                  <div className={requestDetailsStyles.cardsWrapper}>
                      <div className={requestDetailsStyles.cardsGrid}>
                      <div
                          className={requestDetailsStyles.typeHeader}
                          onClick={() => toggleTypeExpanded(type)}
                      >
                          <div className={requestDetailsStyles.typeHeaderContent}>
                              <i className={`fa fa-chevron-${expandedTypes.has(type) ? 'down' : 'right'}`} style={{ marginRight: '8px' }}></i>
                              <h2 className={requestDetailsStyles.typeTitle}>{type} ({groupedItems[type].length})</h2>
                          </div>
                      </div>
                      <div key={type} className={`${expandedTypes.has(type) ? requestDetailsStyles.typeSection : requestDetailsStyles.typeSectionCollapsed}`}>
                          {expandedTypes.has(type) && (
                              <div className={requestDetailsStyles.typeContent}>
                                  {groupedItems[type].map(renderItemCard)}
                              </div>
                          )}
                      </div>
                      </div>
                  </div>
              ))
          ) : (
              <div className={styles.noData}>No request items found for this request</div>
          )}

          {view === 'myView' && (request.RequestStatus === 'Draft' || request.RequestStatus === 'Rejected') && items.length > 0 && items[0].RequestType !== "Software" && (
              <div className={requestDetailsStyles.addButtonContainer}>
                  <button onClick={onAdd} className={requestDetailsStyles.addNewItem}>
                      <i className="fa-solid fa-plus"></i>
                      Add new item
                  </button>
              </div>
          )}
      </>
  );
};

export default RequestItemsList;
