import { useState, useContext } from 'react';
import PMISContext from '../context/PMISContext';
import { MdAdd, MdSearch, MdFolder, MdUploadFile, MdHistory } from 'react-icons/md';

const typeIcon = { pdf: '📄', dwg: '📐', xlsx: '📊', docx: '📝', pptx: '📊', img: '🖼️', default: '📁' };
const statusColors = { approved: '#10b981', pending: '#f59e0b', draft: '#64748b', rejected: '#f43f5e' };

const EmptyState = ({ icon, title, sub, action, onAction }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', gap: 14 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '2px dashed rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{icon}</div>
        <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>{sub}</p>
        {action && <button className="btn btn-primary" onClick={onAction}><MdAdd /> {action}</button>}
    </div>
);

export default function DocumentManagement() {
    const { folders, documents, activeProject, createFolder, createDocument, updateDocumentStatus, deleteDocument } = useContext(PMISContext);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [search, setSearch] = useState('');
    const [showDocForm, setShowDocForm] = useState(false);
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [docForm, setDocForm] = useState({ file_name: '', file_type: 'pdf', description: '', status: 'draft' });
    const [folderForm, setFolderForm] = useState({ folder_name: '', color_hex: '#10b981' });

    const filteredDocs = documents
        .filter(d => !selectedFolder || d.folder_id === selectedFolder)
        .filter(d => d.file_name?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()));

    const handleCreateFolder = async () => {
        if (!activeProject || !folderForm.folder_name) return;
        await createFolder({ project_id: activeProject.project_id, ...folderForm });
        setShowFolderForm(false);
        setFolderForm({ folder_name: '', color_hex: '#10b981' });
    };

    const handleCreateDoc = async () => {
        if (!activeProject || !docForm.file_name) return;
        await createDocument({ project_id: activeProject.project_id, folder_id: selectedFolder || null, ...docForm });
        setShowDocForm(false);
        setDocForm({ file_name: '', file_type: 'pdf', description: '', status: 'draft' });
    };

    return (
        <div className="animate-fadeInUp">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Document Management</h1>
                    <p className="page-subtitle">Drawings, reports & version-controlled project files</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setShowFolderForm(true)}><MdFolder size={14} /> New Folder</button>
                    <button className="btn btn-primary" onClick={() => setShowDocForm(true)}><MdUploadFile size={14} /> Upload Document</button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Documents', value: documents.length || '—', icon: '📄', color: '#10b981' },
                    { label: 'Approved', value: documents.filter(d => d.status === 'approved').length || '—', icon: '✅', color: '#10b981' },
                    { label: 'Pending Review', value: documents.filter(d => d.status === 'pending').length || '—', icon: '⏳', color: '#f59e0b' },
                    { label: 'Folders', value: folders.length || '—', icon: '📁', color: '#14b8a6' },
                ].map((c, i) => (
                    <div key={i} className="glass-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: 26 }}>{c.icon}</div>
                        <div>
                            <p style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: 'Poppins,sans-serif' }}>{c.value}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
                {/* Folder Sidebar */}
                <div className="glass-card" style={{ padding: 16, height: 'fit-content' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Folders</p>
                    <div
                        onClick={() => setSelectedFolder(null)}
                        style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: !selectedFolder ? 'rgba(16,185,129,0.15)' : 'transparent', border: !selectedFolder ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>📁 All Documents</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{documents.length}</span>
                    </div>
                    {folders.length === 0 ? (
                        <div style={{ padding: '12px 0', textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No folders yet.</p>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowFolderForm(true)} style={{ marginTop: 8, fontSize: 11 }}>+ New Folder</button>
                        </div>
                    ) : (
                        folders.map(f => (
                            <div key={f.folder_id}
                                onClick={() => setSelectedFolder(f.folder_id)}
                                style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: selectedFolder === f.folder_id ? 'rgba(16,185,129,0.15)' : 'transparent', border: selectedFolder === f.folder_id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                    <span style={{ color: f.color_hex || '#10b981', marginRight: 6 }}>●</span>
                                    {f.folder_name}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.doc_count || 0}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Documents Table */}
                <div className="glass-card section-card">
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                        <div className="section-card-title" style={{ margin: 0 }}>
                            <span className="title-icon">📄</span>
                            {selectedFolder ? folders.find(f => f.folder_id === selectedFolder)?.folder_name || 'Documents' : 'All Documents'}
                        </div>
                        <div className="search-bar" style={{ minWidth: 220 }}>
                            <MdSearch size={14} />
                            <input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>

                    {filteredDocs.length === 0 ? (
                        <EmptyState
                            icon="📄"
                            title="No Documents Yet"
                            sub={documents.length === 0 ? "Upload your first project document — drawings, reports, specifications, and more." : "No documents match your search or folder filter."}
                            action={documents.length === 0 ? "Upload Document" : null}
                            onAction={() => setShowDocForm(true)}
                        />
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="pmis-table">
                                <thead>
                                    <tr><th>Document</th><th>Type</th><th>Folder</th><th>Uploaded By</th><th>Version</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.map(doc => (
                                        <tr key={doc.document_id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 18 }}>{typeIcon[doc.file_type?.toLowerCase()] || typeIcon.default}</span>
                                                    <div>
                                                        <p style={{ fontSize: 13, fontWeight: 600 }}>{doc.file_name}</p>
                                                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.description?.slice(0, 50) || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-primary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{doc.file_type}</span></td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{doc.folder_name || '—'}</td>
                                            <td>
                                                {doc.uploaded_by_name ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 9, background: '#10b981' }}>{doc.avatar_initials || doc.uploaded_by_name[0]}</div>
                                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{doc.uploaded_by_name}</span>
                                                    </div>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{doc.current_version || 'v1.0'}</td>
                                            <td>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: statusColors[doc.status], background: `${statusColors[doc.status]}18`, padding: '3px 8px', borderRadius: 6 }}>{doc.status}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {doc.status === 'pending' && (
                                                        <button className="btn btn-sm btn-primary" onClick={() => updateDocumentStatus(doc.document_id, 'approved')}>Approve</button>
                                                    )}
                                                    <button className="btn btn-sm btn-secondary" onClick={() => deleteDocument(doc.document_id)} style={{ color: '#f43f5e', fontSize: 11 }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* New Folder Modal */}
            {showFolderForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: 380, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>New Folder</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowFolderForm(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Folder name *" value={folderForm.folder_name} onChange={e => setFolderForm({ ...folderForm, folder_name: e.target.value })} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Folder Color:</label>
                                <input type="color" value={folderForm.color_hex} onChange={e => setFolderForm({ ...folderForm, color_hex: e.target.value })} style={{ width: 40, height: 32, background: 'transparent', border: 'none', cursor: 'pointer' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowFolderForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateFolder}>Create Folder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Document Modal */}
            {showDocForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ padding: 32, width: 440, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Upload Document</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowDocForm(false)}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input className="pmis-input" placeholder="Document name *" value={docForm.file_name} onChange={e => setDocForm({ ...docForm, file_name: e.target.value })} />
                            <select className="pmis-input" value={docForm.file_type} onChange={e => setDocForm({ ...docForm, file_type: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                {['pdf', 'dwg', 'xlsx', 'docx', 'pptx', 'img', 'other'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                            <select className="pmis-input" value={docForm.folder_id || ''} onChange={e => setDocForm({ ...docForm, folder_id: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <option value="">No folder</option>
                                {folders.map(f => <option key={f.folder_id} value={f.folder_id}>{f.folder_name}</option>)}
                            </select>
                            <textarea className="pmis-input" placeholder="Description" rows={3} value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} style={{ resize: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowDocForm(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateDoc}>Upload</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
