import React, { useState, useEffect, useCallback } from 'react';
import PMISContext from './PMISContext';

const Api = (props) => {
    const host = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    // ── Auth State ───────────────────────────────────────────────────────────
    const [authdata, setAuthdata] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);

    // ── Core Data State ──────────────────────────────────────────────────────
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [phases, setPhases] = useState([]);
    const [budgetCategories, setBudgetCategories] = useState([]);
    const [monthlyBudgets, setMonthlyBudgets] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [resources, setResources] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [folders, setFolders] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [channels, setChannels] = useState([]);
    const [messages, setMessages] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [risks, setRisks] = useState([]);
    const [riskTrend, setRiskTrend] = useState([]);
    const [projectStats, setProjectStats] = useState(null);

    // ── apiFetch: always sends Cookie + optional Bearer token ─────────────────
    const apiFetch = useCallback((url, opts = {}) => {
        const token = authdata?.token;
        return fetch(url, {
            credentials: 'include',          // send/receive HttpOnly cookie
            headers: {
                'Content-Type': 'application/json',
                ...(token && token !== 'cookie' ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(opts.headers || {}),
            },
            ...opts,
        });
    }, [authdata?.token]);

    // ── AUTO-LOGIN on page load (cookie or localStorage) ─────────────────────
    useEffect(() => {
        const restoreSession = async () => {
            const savedToken = localStorage.getItem('pmis_token');
            try {
                const response = await fetch(`${host}/api/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(savedToken ? { 'Authorization': `Bearer ${savedToken}` } : {}),
                    },
                });
                if (response.ok) {
                    const json = await response.json();
                    setAuthdata({ token: savedToken || 'cookie', user: json.user });
                } else {
                    localStorage.removeItem('pmis_token');
                    localStorage.removeItem('pmis_user');
                    setAuthdata(null);
                }
            } catch (err) {
                console.error('Session restore failed:', err);
                setAuthdata(null);
            }
            setAuthLoading(false);
        };
        restoreSession();
    }, []);

    // ── Load projects once logged in ──────────────────────────────────────────
    useEffect(() => {
        if (authdata?.token) fetchProjects();
    }, [authdata?.token]);

    // ── Load module data when activeProject changes ───────────────────────────
    useEffect(() => {
        if (activeProject?.project_id) {
            const pid = activeProject.project_id;
            fetchTasks(pid); fetchPhases(pid);
            fetchBudgetCategories(pid); fetchMonthlyBudgets(pid); fetchExpenses(pid);
            fetchResources(pid);
            fetchFolders(pid); fetchDocuments(pid);
            fetchChannels(pid); fetchAnnouncements(pid); fetchWorkspaces(pid);
            fetchRisks(pid); fetchRiskTrend(pid);
            fetchProjectStats(pid);
        }
    }, [activeProject?.project_id]);

    // ════════════════════════════════════════════════════════════════════════════
    // ── AUTH ─────────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const login = async (email, password) => {
        try {
            const response = await fetch(`${host}/api/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const json = await response.json();
            if (json.success) {
                localStorage.setItem('pmis_token', json.token);
                localStorage.setItem('pmis_user', JSON.stringify(json.user));
                setAuthdata({ token: json.token, user: json.user });
            }
            return json;
        } catch (err) {
            return { success: false, message: 'Network error.' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${host}/api/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            return await response.json();
        } catch (err) {
            return { success: false, message: 'Network error.' };
        }
    };

    const logout = async () => {
        try {
            await fetch(`${host}/api/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (_) { }
        localStorage.removeItem('pmis_token');
        localStorage.removeItem('pmis_user');
        setAuthdata(null);
        setActiveProject(null);
        setProjects([]);
    };

    const updateUserDetails = async (userId, data) => {
        try {
            const res = await apiFetch(`${host}/api/users/${userId}`, { 
                method: 'PUT',
                body: JSON.stringify(data)
            });
            const json = await res.json();
            
            if (json.success) {
                // Also fetch the full user back from `/auth/me` to ensure context is perfectly synced,
                // or just merge what we sent explicitly. Let's merge locally.
                setAuthdata(prev => {
                    const mergedUser = { ...(prev.user || prev), ...data };
                    localStorage.setItem('pmis_user', JSON.stringify(mergedUser));
                    return { ...prev, user: mergedUser };
                });
            }
            return json;
        } catch (err) {
            return { success: false, message: 'Network error.' };
        }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── PROJECTS ─────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const fetchProjects = useCallback(async () => {
        try {
            const res = await apiFetch(`${host}/api/projects`);
            const json = await res.json();
            if (json.success) {
                setProjects(json.data);
                if (!activeProject && json.data.length > 0) setActiveProject(json.data[0]);
            }
        } catch (err) { console.error('fetchProjects:', err); }
    }, [authdata?.token]);

    const createProject = async (projectData) => {
        try {
            const res = await apiFetch(`${host}/api/projects`, { method: 'POST', body: JSON.stringify(projectData) });
            const json = await res.json();
            if (json.success) fetchProjects();
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const updateProject = async (id, data) => {
        try {
            const res = await apiFetch(`${host}/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchProjects();
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const fetchProjectStats = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/projects/${projectId}/stats`);
            const json = await res.json();
            if (json.success) setProjectStats(json.data);
        } catch (err) { console.error('fetchProjectStats:', err); }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── PLANNING & SCHEDULING ────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const fetchPhases = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/phases?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) setPhases(json.data);
        } catch (err) { console.error('fetchPhases:', err); }
    };

    const fetchTasks = async (projectId, filters = {}) => {
        try {
            const params = new URLSearchParams({ project_id: projectId, ...filters });
            const res = await apiFetch(`${host}/api/tasks?${params}`);
            const json = await res.json();
            if (json.success) setTasks(json.data);
        } catch (err) { console.error('fetchTasks:', err); }
    };

    const createTask = async (taskData) => {
        try {
            const res = await apiFetch(`${host}/api/tasks`, { method: 'POST', body: JSON.stringify(taskData) });
            const json = await res.json();
            if (json.success) fetchTasks(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const updateTask = async (id, data) => {
        try {
            const res = await apiFetch(`${host}/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchTasks(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const deleteTask = async (id) => {
        try {
            const res = await apiFetch(`${host}/api/tasks/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchTasks(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── COST MANAGEMENT ──────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const fetchBudgetCategories = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/costs/categories?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) setBudgetCategories(json.data);
        } catch (err) { console.error('fetchBudgetCategories:', err); }
    };

    const fetchMonthlyBudgets = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/costs/monthly?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) setMonthlyBudgets(json.data);
        } catch (err) { console.error('fetchMonthlyBudgets:', err); }
    };

    const fetchExpenses = async (projectId, filters = {}) => {
        try {
            const params = new URLSearchParams({ project_id: projectId, ...filters });
            const res = await apiFetch(`${host}/api/costs/expenses?${params}`);
            const json = await res.json();
            if (json.success) setExpenses(json.data);
        } catch (err) { console.error('fetchExpenses:', err); }
    };

    const createExpense = async (expenseData) => {
        try {
            const res = await apiFetch(`${host}/api/costs/expenses`, { method: 'POST', body: JSON.stringify(expenseData) });
            const json = await res.json();
            if (json.success) fetchExpenses(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const updateExpenseStatus = async (id, status) => {
        try {
            const res = await apiFetch(`${host}/api/costs/expenses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
            const json = await res.json();
            if (json.success) fetchExpenses(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const deleteExpense = async (id) => {
        try {
            const res = await apiFetch(`${host}/api/costs/expenses/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchExpenses(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── RESOURCE MANAGEMENT ──────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const fetchResources = async (projectId, filters = {}) => {
        try {
            const params = new URLSearchParams({ project_id: projectId, ...filters });
            const res = await apiFetch(`${host}/api/resources?${params}`);
            const json = await res.json();
            if (json.success) setResources(json.data);
        } catch (err) { console.error('fetchResources:', err); }
    };

    const createResource = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/resources`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchResources(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const updateResource = async (id, data) => {
        try {
            const res = await apiFetch(`${host}/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchResources(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const deleteResource = async (id) => {
        try {
            const res = await apiFetch(`${host}/api/resources/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchResources(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const createAssignment = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/resources/assignments`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) {
                const assignRes = await apiFetch(`${host}/api/resources/assignments?project_id=${activeProject.project_id}`);
                const assignJson = await assignRes.json();
                if (assignJson.success) setAssignments(assignJson.data);
            }
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── DOCUMENT MANAGEMENT ──────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const fetchFolders = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/documents/folders?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) setFolders(json.data);
        } catch (err) { console.error('fetchFolders:', err); }
    };

    const createFolder = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/documents/folders`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchFolders(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const fetchDocuments = async (projectId, filters = {}) => {
        try {
            const params = new URLSearchParams({ project_id: projectId, ...filters });
            const res = await apiFetch(`${host}/api/documents?${params}`);
            const json = await res.json();
            if (json.success) setDocuments(json.data);
        } catch (err) { console.error('fetchDocuments:', err); }
    };

    const createDocument = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/documents`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchDocuments(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const updateDocumentStatus = async (id, status) => {
        try {
            const res = await apiFetch(`${host}/api/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
            const json = await res.json();
            if (json.success) fetchDocuments(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const deleteDocument = async (id) => {
        try {
            const res = await apiFetch(`${host}/api/documents/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchDocuments(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const addDocumentVersion = async (id, data) => {
        try {
            const res = await apiFetch(`${host}/api/documents/${id}/versions`, { method: 'POST', body: JSON.stringify(data) });
            return await res.json();
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── COMMUNICATION ────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const fetchChannels = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/communication/channels?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) {
                setChannels(json.data);
                if (!activeChannel && json.data.length > 0) setActiveChannel(json.data[0]);
            }
        } catch (err) { console.error('fetchChannels:', err); }
    };

    const createChannel = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/communication/channels`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchChannels(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const fetchMessages = async (channelId, limit = 50) => {
        try {
            const res = await apiFetch(`${host}/api/communication/messages?channel_id=${channelId}&limit=${limit}`);
            const json = await res.json();
            if (json.success) setMessages(json.data);
        } catch (err) { console.error('fetchMessages:', err); }
    };

    const sendMessage = async (channelId, messageText) => {
        try {
            const res = await apiFetch(`${host}/api/communication/messages`, {
                method: 'POST', body: JSON.stringify({ channel_id: channelId, message_text: messageText }),
            });
            const json = await res.json();
            if (json.success) fetchMessages(channelId);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const deleteMessage = async (messageId, channelId) => {
        try {
            const res = await apiFetch(`${host}/api/communication/messages/${messageId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchMessages(channelId);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const fetchAnnouncements = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/communication/announcements?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) setAnnouncements(json.data);
        } catch (err) { console.error('fetchAnnouncements:', err); }
    };

    const createAnnouncement = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/communication/announcements`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchAnnouncements(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const fetchWorkspaces = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/communication/workspaces?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) setWorkspaces(json.data);
        } catch (err) { console.error('fetchWorkspaces:', err); }
    };

    const createWorkspace = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/communication/workspaces`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchWorkspaces(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── RISK MANAGEMENT ──────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const fetchRisks = async (projectId, filters = {}) => {
        try {
            const params = new URLSearchParams({ project_id: projectId, ...filters });
            const res = await apiFetch(`${host}/api/risks?${params}`);
            const json = await res.json();
            if (json.success) setRisks(json.data);
        } catch (err) { console.error('fetchRisks:', err); }
    };

    const createRisk = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/risks`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchRisks(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const updateRisk = async (id, data) => {
        try {
            const res = await apiFetch(`${host}/api/risks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchRisks(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const deleteRisk = async (id) => {
        try {
            const res = await apiFetch(`${host}/api/risks/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchRisks(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    const fetchRiskTrend = async (projectId) => {
        try {
            const res = await apiFetch(`${host}/api/risks/trend?project_id=${projectId}`);
            const json = await res.json();
            if (json.success) setRiskTrend(json.data);
        } catch (err) { console.error('fetchRiskTrend:', err); }
    };

    const logRiskTrend = async (data) => {
        try {
            const res = await apiFetch(`${host}/api/risks/trend`, { method: 'POST', body: JSON.stringify(data) });
            const json = await res.json();
            if (json.success) fetchRiskTrend(activeProject.project_id);
            return json;
        } catch (err) { return { success: false, message: 'Network error.' }; }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── CONTEXT VALUE ────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    return (
        <PMISContext.Provider value={{
            authdata, authLoading, login, register, logout, updateUserDetails,
            pageLoading, setPageLoading,
            projects, activeProject, setActiveProject,
            projectStats, fetchProjects, createProject, updateProject,
            phases, tasks, fetchPhases, fetchTasks, createTask, updateTask, deleteTask,
            budgetCategories, monthlyBudgets, expenses,
            fetchBudgetCategories, fetchMonthlyBudgets, fetchExpenses,
            createExpense, updateExpenseStatus, deleteExpense,
            resources, assignments,
            fetchResources, createResource, updateResource, deleteResource, createAssignment,
            folders, documents,
            fetchFolders, createFolder,
            fetchDocuments, createDocument, updateDocumentStatus, deleteDocument, addDocumentVersion,
            channels, messages, announcements, workspaces,
            activeChannel, setActiveChannel,
            fetchChannels, createChannel,
            fetchMessages, sendMessage, deleteMessage,
            fetchAnnouncements, createAnnouncement,
            fetchWorkspaces, createWorkspace,
            risks, riskTrend,
            fetchRisks, createRisk, updateRisk, deleteRisk,
            fetchRiskTrend, logRiskTrend,
        }}>
            {props.children}
        </PMISContext.Provider>
    );
};

export default Api;
