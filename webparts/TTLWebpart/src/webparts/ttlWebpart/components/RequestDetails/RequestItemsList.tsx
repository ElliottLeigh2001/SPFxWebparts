import * as React from 'react';
import { useState, useMemo } from 'react';
import { UserRequestItem } from '../../Interfaces/TTLInterfaces';
import requestDetailsStyles from './RequestDetails.module.scss';
import styles from '../Dashboard/TtlWebpart.module.scss';
import { formatDate } from '../../Helpers/HelperFunctions';
import { RequestItemsListProps } from './RequestDetailsProps';
import { FilePicker, IFilePickerResult } from '@pnp/spfx-controls-react/lib/FilePicker';
import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import { getDocumentGuidForRequestItem } from '../../service/TTLService';

const RequestItemsList: React.FC<RequestItemsListProps> = ({
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

    // Group items by request type
    const groupedItems = useMemo(() => {
        const groups: { [key: string]: UserRequestItem[] } = {};
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

    // Function for making API calls to SharePoint
    const getSP = (context: any): SPFI => {
        return spfi(context.pageContext.web.absoluteUrl).using(SPFx(context));
    };

    // Parse UsersLicense to show all users in a single string
    const getUsersLicenseDisplay = (usersLicense: any[] | undefined): string => {
        if (!usersLicense || !Array.isArray(usersLicense) || usersLicense.length === 0) {
            return '/';
        }

        const people = usersLicense.map(user => user.Title);

        return people.join(', ');
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

        } catch (error) {
          console.error("Error uploading or linking document:", error);
        }
      }
    };

    // Download file for a specific requestitem
    const downloadFile = async (item: UserRequestItem) => {
        const sp = getSP(context);
        
        // get the GUID for the document
        const fileId = await getDocumentGuidForRequestItem(context!, item.ID!);
        if (!fileId) {
            console.error("No file ID found");
            return;
        }

        // Get file metadata 
        const file = sp.web.getFileById(fileId);
        // Select the name of the file  
        const fileInfo = await file.select("Name")();

        const fileName = fileInfo?.Name || "download";

        // Get file binary
        const blob = await file.getBlob();

        // Create blob URL
        const blobUrl = URL.createObjectURL(blob);

        // Trigger download with correct filename
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        a.click();

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    };

    // For each request item in the request, render a card with the appropriate fields
    const renderItemCard = (item: UserRequestItem) => {
        return (
            <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
            <div
                key={item.ID}
                className={requestDetailsStyles.requestCard}
            >
                <div className={requestDetailsStyles.cardHeader}>
                    <div className={requestDetailsStyles.cardTitle}>
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
                            <button className={requestDetailsStyles.iconButtonDocument} title="Upload Document">
                                <i className="fa fa-upload" aria-hidden="true"></i>

                                <FilePicker
                                    context={context as any}
                                    accepts={[".pdf", ".docx", ".xlsx", ".msg", ".eml", ".jpg", "png"]}
                                    onSave={(files) => onFilePickerSave(files, item.ID!)}
                                    hideSiteFilesTab={true}
                                    hideStockImages={true}
                                    hideOneDriveTab={true}
                                    hideOrganisationalAssetTab={true}
                                    hideWebSearchTab={true}
                                    hideLocalUploadTab={false}
                                    hideLocalMultipleUploadTab={true}
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
                                onClick={async () => {
                                    try {
                                        downloadFile(item);

                                    } catch (err) {
                                    console.error('Error downloading document:', err);
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
                                {item.Link.length > 40 ? `${item.Link.substring(0, 40)}...` : item.Link}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
        );
    };

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
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

                    {view === 'myView' && request.RequestStatus === 'Draft' && items[0].RequestType !== "Software" && (
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
