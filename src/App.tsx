/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend, Sector
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, 
  Calendar, Filter, Search, ChevronDown, Download,
  CreditCard, Wallet, Banknote, Smartphone, Upload, FileText, Truck,
  ArrowUpDown, ArrowUp, ArrowDown,
  User as UserIcon, LogOut, Settings, ShieldCheck, Mail, Lock, User as UserCircle,
  Github, Linkedin, CheckCircle, AlertCircle, Loader2, X, Trash2, Info
} from 'lucide-react';
import { motion, AnimatePresence, animate } from 'motion/react';
import { 
  format, parseISO, startOfDay, endOfDay, isWithinInterval,
  subDays, subMonths, startOfMonth, endOfMonth,
  isToday, isTomorrow, isYesterday, isPast
} from 'date-fns';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Order, parseData, CITIES } from './data';
import firebaseConfigJson from '../firebase-applet-config.json';
import { SalesMap } from './components/SalesMap';
import { ModernDatePicker } from './components/ModernDatePicker';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { 
  auth, signInWithGoogle, logout, onAuthStateChanged, db, doc, onSnapshot, updateDoc,
  signUpWithEmail, loginWithEmail, collection, addDoc, deleteDoc, query, orderBy, serverTimestamp,
  resetPassword, writeBatch, getDocs, getDoc, setDoc, handleFirestoreError, OperationType,
  sendVerificationCode, verifyCode
} from './firebase';
import { CheckCircle2, Circle, Plus, ListTodo } from 'lucide-react';

const COLORS = ['#141414', '#F27D26', '#5A5A40', '#8E9299', '#D1D5DB'];

const CountUp = ({ value }: { value: string }) => {
  const [displayValue, setDisplayValue] = useState('0');
  
  useEffect(() => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }
    
    const isCurrency = value.includes('$');
    const hasDecimals = value.includes('.');
    
    const controls = animate(0, numericValue, {
      duration: 1.5,
      ease: [0.21, 0.47, 0.32, 0.98], // Custom ease-out
      onUpdate: (latest) => {
        if (isCurrency) {
          setDisplayValue(`$${latest.toLocaleString(undefined, { 
            minimumFractionDigits: hasDecimals ? 2 : 0, 
            maximumFractionDigits: hasDecimals ? 2 : 0 
          })}`);
        } else {
          setDisplayValue(Math.floor(latest).toLocaleString());
        }
      }
    });
    
    return () => controls.stop();
  }, [value]);
  
  return <>{displayValue}</>;
};

const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, index, layout, radius } = props;
  const isHorizontal = layout === 'vertical';
  
  const safeX = Number(x) || 0;
  const safeY = Number(y) || 0;
  const safeWidth = Number(width) || 0;
  const safeHeight = Number(height) || 0;

  return (
    <motion.rect
      fill={fill}
      rx={radius ? (Array.isArray(radius) ? radius[0] : radius) : 0}
      ry={radius ? (Array.isArray(radius) ? radius[0] : radius) : 0}
      initial={isHorizontal ? 
        { x: safeX, y: safeY, width: 0, height: safeHeight } : 
        { x: safeX, y: safeY + safeHeight, width: safeWidth, height: 0 }
      }
      animate={isHorizontal ? 
        { width: safeWidth } : 
        { height: safeHeight, y: safeY }
      }
      transition={{ 
        duration: 0.6, 
        delay: (index || 0) * 0.08, 
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
    />
  );
};

const StatCard = React.memo(({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
    className="bg-white p-[1rem] sm:p-[1.5rem] border border-[#141414]/10 rounded-[0.75rem] shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start mb-[0.75rem] sm:mb-[1rem]">
      <div className="p-[0.4rem] sm:p-[0.5rem] bg-[#141414]/5 rounded-[0.5rem]">
        <Icon className="w-[1rem] h-[1rem] sm:w-[1.25rem] sm:h-[1.25rem] text-[#141414]" />
      </div>
      {trend && (
        <span className="text-[0.65rem] sm:text-[0.7rem] font-medium text-emerald-600 bg-emerald-50 px-[0.4rem] sm:px-[0.5rem] py-[0.2rem] sm:py-[0.25rem] rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-[0.875rem] sm:text-[1rem] font-medium text-[#141414]/60 uppercase tracking-wider mb-[0.2rem] sm:mb-[0.25rem]">{title}</p>
    <h3 className="text-[1.5rem] sm:text-[1.75rem] font-bold text-[#141414] font-mono break-all">
      <CountUp value={value} />
    </h3>
  </motion.div>
));

const ModernDateDisplay = React.memo(({ dueDate, completed }: { dueDate: any, completed: boolean }) => {
  if (!dueDate) return null;

  const date = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
  const isOverdue = isPast(date) && !isToday(date) && !completed;

  let label = format(date, 'MMM d, yyyy');
  let colorClass = 'text-[#141414]/40';
  let bgClass = 'bg-[#141414]/5';

  if (isToday(date)) {
    label = 'Today';
    colorClass = completed ? 'text-emerald-600/60' : 'text-emerald-600';
    bgClass = completed ? 'bg-emerald-50/50' : 'bg-emerald-50';
  } else if (isTomorrow(date)) {
    label = 'Tomorrow';
    colorClass = completed ? 'text-blue-600/60' : 'text-blue-600';
    bgClass = completed ? 'bg-blue-50/50' : 'bg-blue-50';
  } else if (isYesterday(date)) {
    label = 'Yesterday';
    colorClass = completed ? 'text-red-600/60' : 'text-red-600';
    bgClass = completed ? 'bg-red-50/50' : 'bg-red-50';
  } else if (isOverdue) {
    colorClass = 'text-red-600';
    bgClass = 'bg-red-50';
  }

  return (
    <div className={`flex items-center gap-[0.375rem] px-[0.625rem] py-[0.25rem] rounded-full sm:ml-auto transition-colors ${bgClass}`}>
      <Calendar className={`w-[0.75rem] h-[0.75rem] ${colorClass}`} />
      <span className={`text-[0.6875rem] font-bold uppercase tracking-wider ${colorClass}`}>
        {isOverdue && !isYesterday(date) ? `Overdue: ${label}` : label}
      </span>
    </div>
  );
});

const SearchInput = React.memo(({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(val);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative w-full sm:w-[20rem]">
      <Search className="absolute left-[0.75rem] top-1/2 -translate-y-1/2 w-[0.875rem] h-[0.875rem] text-[#141414]/40" />
      <input 
        type="text" 
        placeholder="Search products, IDs..." 
        className="w-full pl-[2.25rem] pr-[0.75rem] py-[0.5rem] bg-[#141414]/5 border border-none rounded-[0.5rem] focus:outline-none focus:ring-2 focus:ring-[#141414]/5 transition-all text-[0.8125rem]"
        value={localValue}
        onChange={handleChange}
      />
    </div>
  );
});

const TaskForm = React.memo(({ onAddTask, isQuotaExceeded }: { onAddTask: (text: string, priority: 'High' | 'Medium' | 'Low', dueDate: string) => Promise<void>, isQuotaExceeded: boolean }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isQuotaExceeded) return;
    await onAddTask(text, priority, dueDate);
    setText('');
    setDueDate('');
    setPriority('Medium');
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-[0.75rem] mb-[1.5rem] relative z-50 overflow-visible ${isQuotaExceeded ? 'opacity-60 grayscale' : ''}`}>
      <input 
        type="text" 
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isQuotaExceeded}
        placeholder={isQuotaExceeded ? "Writes disabled (Quota Exceeded)" : "What needs to be done today?"}
        className="w-full px-[1rem] py-[0.75rem] bg-[#141414]/5 border border-transparent rounded-[0.5rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium text-[0.875rem] disabled:cursor-not-allowed"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[0.75rem]">
        <select 
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          disabled={isQuotaExceeded}
          className="w-full px-[1rem] py-[0.75rem] bg-[#141414]/5 border border-transparent rounded-[0.5rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium text-[0.875rem] appearance-none cursor-pointer disabled:cursor-not-allowed"
        >
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        <div className="w-full">
          <ModernDatePicker 
            label="Due Date" 
            value={dueDate} 
            onChange={setDueDate} 
            disabled={isQuotaExceeded}
            align="right"
          />
        </div>
      </div>
      <button 
        type="submit"
        disabled={!text.trim() || isQuotaExceeded}
        className="w-full px-[1.25rem] py-[1rem] sm:py-[0.75rem] bg-[#141414] text-white rounded-[0.75rem] font-bold text-[0.875rem] hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-[0.5rem] whitespace-nowrap disabled:cursor-not-allowed active:scale-[0.98]"
      >
        <Plus className="w-[1.125rem] h-[1.125rem] sm:w-[1rem] sm:h-[1rem]" />
        <span>{isQuotaExceeded ? 'Quota Exceeded' : 'Add Task'}</span>
      </button>
    </form>
  );
});

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Email Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'none' | 'pending'>('none');
  const [enteredCode, setEnteredCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationPreviewUrl, setVerificationPreviewUrl] = useState<string | null>(null);

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'uploading' | 'completed' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSummary, setUploadSummary] = useState<{
    total: number;
    originalTotal?: number;
    isLimited?: boolean;
    valid: number;
    invalid: number;
    missingFields: string[];
    error?: string;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isPickerApiLoaded, setIsPickerApiLoaded] = useState(false);
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  useEffect(() => {
    const loadGapi = () => {
      const gapi = (window as any).gapi;
      if (gapi) {
        gapi.load('picker', () => {
          setIsPickerApiLoaded(true);
        });
      }
    };
    
    const checkGapi = setInterval(() => {
      if ((window as any).gapi) {
        loadGapi();
        clearInterval(checkGapi);
      }
    }, 500);
    
    return () => clearInterval(checkGapi);
  }, []);

  const handleGoogleDriveUpload = async () => {
    if (isQuotaExceeded || isAuthInProgress) return;
    
    let token = googleAccessToken;
    
    // If no token, attempt to get one by re-authenticating with Google
    if (!token) {
      setIsAuthInProgress(true);
      try {
        const result = await signInWithGoogle();
        if (result && result.accessToken) {
          token = result.accessToken;
          setGoogleAccessToken(token);
        } else {
          // If result is null, it means it was cancelled or already open
          if (!result) {
            setIsAuthInProgress(false);
            return;
          }
          setToast({ message: 'Please sign in with Google to access Drive.', type: 'error' });
          setIsAuthInProgress(false);
          return;
        }
      } catch (error) {
        console.error('Drive Auth Error:', error);
        setToast({ message: 'Failed to authenticate with Google Drive.', type: 'error' });
        setIsAuthInProgress(false);
        return;
      } finally {
        setIsAuthInProgress(false);
      }
    }

    const pickerApi = (window as any).google?.picker;
    if (!pickerApi || !isPickerApiLoaded) {
      setToast({ message: 'Google Picker API is still loading. Please try again.', type: 'error' });
      return;
    }

    const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '').replace(/[^a-zA-Z0-9-_]/g, '').trim();
    const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
    const projectId = firebaseConfigJson.projectId;

    // In AI Studio iframes, we need to be very specific about the origin
    const origin = window.location.protocol + '//' + window.location.host;

    console.log('--- Google Picker Iframe Debug ---');
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('Project ID:', projectId);
    console.log('Detected Origin:', origin);
    console.log('---------------------------');

    if (!clientId) {
      setToast({ 
        message: 'Google Drive Client ID is missing. Please add VITE_GOOGLE_DRIVE_CLIENT_ID to your Vercel environment variables.', 
        type: 'error' 
      });
      return;
    }

    const pickerCallback = async (data: any) => {
      if (data.action === pickerApi.Action.PICKED) {
        const file = data.docs[0];
        const fileId = file.id;
        const mimeType = file.mimeType;
        
        setUploadStatus('parsing');
        setUploadProgress(10);
        
        try {
          let content = '';
          // If it's a Google Sheet, export it as CSV
          if (mimeType === 'application/vnd.google-apps.spreadsheet') {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            if (!response.ok) throw new Error('Failed to export Google Sheet');
            content = await response.text();
          } else {
            // Otherwise try to download the file directly
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            if (!response.ok) throw new Error('Failed to download file');
            content = await response.text();
          }
          
          setUploadProgress(50);
          const orders = parseData(content);
          if (orders.length > 0) {
            await processParsedData(orders, ['Order Number', 'Product', 'Price', 'Date']);
          } else {
            throw new Error('No valid data found in the selected file.');
          }
        } catch (error: any) {
          console.error('Drive Download Error:', error);
          setUploadStatus('error');
          setUploadSummary({ total: 0, valid: 0, invalid: 0, missingFields: [], error: error.message || 'Failed to process Drive file.' });
        }
      }
    };

    const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS)
      .setMimeTypes('application/vnd.google-apps.spreadsheet,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const picker = new pickerApi.PickerBuilder()
      .enableFeature(pickerApi.Feature.NAV_HIDDEN)
      .setDeveloperKey(apiKey)
      .setAppId(projectId)
      .setOAuthToken(token)
      .setOrigin(origin)
      .addView(view)
      .setCallback(pickerCallback)
      .build();
    
    picker.setVisible(true);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  const handleSort = (key: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [tasks, setTasks] = useState<any[]>([]);
  const [taskSortBy, setTaskSortBy] = useState<'date' | 'priority'>('date');

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (taskSortBy === 'priority') {
        const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const pA = priorityMap[a.priority as keyof typeof priorityMap] || 0;
        const pB = priorityMap[b.priority as keyof typeof priorityMap] || 0;
        if (pA !== pB) return pB - pA;
      }
      // Default sort by date (createdAt)
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [tasks, taskSortBy]);

  // Orders Listener
  useEffect(() => {
    if (!user) {
      setAllOrders([]);
      setIsOrdersLoading(false);
      return;
    }

    const ordersRef = collection(db, 'users', user.uid, 'orders');
    const q = query(ordersRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data() as Order;
        let date = data.date;
        
        // Sanitize date (handle Excel serial dates that might be in the DB)
        if (date && !isNaN(Number(date)) && Number(date) > 30000) {
          const excelDate = new Date((Number(date) - 25569) * 86400 * 1000);
          date = format(excelDate, 'yyyy-MM-dd');
        }
        
        let timestamp = 0;
        try {
          timestamp = parseISO(date).getTime();
        } catch (e) {
          timestamp = 0;
        }

        return {
          ...data,
          date,
          timestamp,
          id: doc.id
        };
      });
      setAllOrders(orders);
      setIsOrdersLoading(false);
    }, (error) => {
      console.error('Firestore Orders Error:', error);
      if (error.message?.includes('quota') || error.message?.includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
      }
      setIsOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Profile Listener
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setTasks([]);
      return;
    }
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        setNewName(data.displayName);
        setNewUsername(data.username || '');
      }
    });

    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeTasks();
    };
  }, [user]);

  const handleAddTask = React.useCallback(async (text: string, priority: 'High' | 'Medium' | 'Low', dueDate: string) => {
    if (!user || !text.trim()) return;
    try {
      const taskData: any = {
        text: text.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        priority: priority
      };
      if (dueDate) {
        taskData.dueDate = new Date(dueDate);
      }
      await addDoc(collection(db, 'users', user.uid, 'tasks'), taskData);
    } catch (error: any) {
      console.error('Error adding task:', error);
      if (error.message?.includes('quota') || error.message?.includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
      }
    }
  }, [user]);

  const handleToggleTask = React.useCallback(async (taskId: string, completed: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
        completed: !completed
      });
    } catch (error: any) {
      console.error('Error toggling task:', error);
      if (error.message?.includes('quota') || error.message?.includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
      }
    }
  }, [user]);

  const handleDeleteTask = React.useCallback(async (taskId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      if (error.message?.includes('quota') || error.message?.includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
      }
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user || !newName.trim()) return;
    try {
      const updates: any = {
        displayName: newName.trim(),
        username: newUsername.trim()
      };
      if (newPhoto) {
        updates.photoURL = newPhoto;
      }
      await updateDoc(doc(db, 'users', user.uid), updates);
      setIsProfileModalOpen(false);
      setNewPhoto(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('quota') || error.message?.includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
        setToast({ message: 'Firestore Quota Exceeded. Profile update failed.', type: 'error' });
      } else {
        alert('Failed to update profile. Please try again.');
      }
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 350000) { // Limit to ~350KB for base64 storage (~466KB string)
        alert('Image is too large. Please select an image under 350KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const products = useMemo(() => ['All', ...new Set(allOrders.map(o => o.product))], [allOrders]);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'Last 7 Days':
        start = format(subDays(now, 7), 'yyyy-MM-dd');
        end = format(now, 'yyyy-MM-dd');
        break;
      case 'This Month':
        start = format(startOfMonth(now), 'yyyy-MM-dd');
        end = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'Last Month':
        const lastMonth = subMonths(now, 1);
        start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      case 'All':
        start = '';
        end = '';
        break;
      default:
        return;
    }
    setDateRange({ start, end });
  };

  const filteredOrders = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const hasSearch = searchLower.length > 0;
    const hasProductFilter = productFilter !== 'All';
    const hasDateRange = !!(dateRange.start && dateRange.end);
    
    let startTs = 0;
    let endTs = 0;
    if (hasDateRange) {
      try {
        startTs = startOfDay(parseISO(dateRange.start)).getTime();
        endTs = endOfDay(parseISO(dateRange.end)).getTime();
      } catch (e) {
        // Fallback or ignore
      }
    }

    let result = allOrders.filter(order => {
      if (hasSearch) {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchLower) ||
                            order.product.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      if (hasProductFilter) {
        if (order.product !== productFilter) return false;
      }
      
      if (hasDateRange && startTs && endTs) {
        const orderDate = (order as any).timestamp || 0;
        if (orderDate < startTs || orderDate > endTs) return false;
      }

      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [allOrders, searchTerm, productFilter, dateRange, sortConfig]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.price, 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    const uniqueProducts = new Set(filteredOrders.map(o => o.product)).size;
    
    const statusCounts = filteredOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      revenue: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      orders: filteredOrders.length.toString(),
      avgValue: `$${avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      products: uniqueProducts.toString(),
      status: statusCounts
    };
  }, [filteredOrders]);

  const revenueByDate = useMemo(() => {
    const data: Record<string, { revenue: number, orders: number }> = {};
    filteredOrders.forEach(o => {
      if (!data[o.date]) data[o.date] = { revenue: 0, orders: 0 };
      data[o.date].revenue += o.price;
      data[o.date].orders += 1;
    });
    return Object.entries(data)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const salesByProduct = useMemo(() => {
    const data: Record<string, { revenue: number, orders: number }> = {};
    filteredOrders.forEach(o => {
      if (!data[o.product]) data[o.product] = { revenue: 0, orders: 0 };
      data[o.product].revenue += o.price;
      data[o.product].orders += 1;
    });
    return Object.entries(data)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const salesByCountry = useMemo(() => {
    const data: Record<string, { revenue: number, orders: number }> = {};
    filteredOrders.forEach(o => {
      if (!data[o.country]) data[o.country] = { revenue: 0, orders: 0 };
      data[o.country].revenue += o.price;
      data[o.country].orders += 1;
    });
    return Object.entries(data)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    const data: Record<string, number> = {};
    filteredOrders.forEach(o => {
      data[o.status] = (data[o.status] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const STATUS_COLORS: Record<string, string> = {
    'Shipped': '#10B981',
    'In Process': '#3B82F6',
    'On Hold': '#F59E0B',
    'Cancelled': '#6B7280',
    'Disputed': '#EF4444'
  };

  const processParsedData = async (data: any[], headers: string[]) => {
    try {
      setUploadStatus('parsing');
      setUploadProgress(0);
      setUploadSummary(null);
      
      const ROW_LIMIT = 5000;
      const originalTotal = data.length;
      const isLimited = originalTotal > ROW_LIMIT;
      const dataToProcess = isLimited ? data.slice(0, ROW_LIMIT) : data;

      console.log('Processing data. Rows found:', originalTotal);
      if (isLimited) console.log(`Limiting to first ${ROW_LIMIT} rows.`);
      console.log('Detected headers:', headers);
      
      if (originalTotal === 0) {
        setUploadStatus('error');
        setUploadSummary({ total: 0, valid: 0, invalid: 0, missingFields: [], error: 'The file appears to be empty.' });
        return;
      }

      // Track which fields we successfully mapped
      const mappedFields = {
        orderNumber: false,
        product: false,
        price: false,
        date: false,
        city: false,
        country: false,
        status: false
      };

      const invalidRows: any[] = [];
      const parsedData: Order[] = dataToProcess.map((row: any, index: number) => {
        // Create a case-insensitive key lookup map and strip any non-alphanumeric chars for matching
        const normalizedRow: Record<string, any> = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
          normalizedRow[cleanKey] = row[key];
        });

        // Helper to get value by checking multiple common header names (fuzzy matching)
        const getValue = (keys: string[], fieldName: keyof typeof mappedFields) => {
          for (const key of keys) {
            const cleanSearchKey = key.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
            const val = normalizedRow[cleanSearchKey];
            if (val !== undefined && val !== null && val.toString().trim() !== '') {
              mappedFields[fieldName] = true;
              return val.toString().trim();
            }
          }
          return '';
        };

        const cityName = getValue(['city', 'location', 'town', 'address', 'area'], 'city');
        let cityData = CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
        
        if (!cityData) {
          cityData = CITIES[index % CITIES.length];
        }

        let dateStr = getValue(['date', 'orderdate', 'saledate', 'timestamp', 'time', 'day'], 'date').replace(/"/g, '');
        
        // Handle Excel numeric dates if they come through as numbers
        if (dateStr && !isNaN(Number(dateStr)) && Number(dateStr) > 30000) {
          const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
          dateStr = format(excelDate, 'yyyy-MM-dd');
        } else if (dateStr.includes('/')) {
          // Clean up time part if present (e.g., "2/24/2003 0:00" -> "2/24/2003")
          const cleanDate = dateStr.split(' ')[0];
          const parts = cleanDate.split('/');
          if (parts.length === 3) {
            const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            
            // Basic check for D/M/Y vs M/D/Y
            if (parseInt(month) > 12) {
              dateStr = `${year}-${day}-${month}`;
            } else {
              dateStr = `${year}-${month}-${day}`;
            }
          }
        }

        const orderNum = getValue(['ordernumber', 'orderid', 'id', 'transactionid', 'ref'], 'orderNumber');
        const productName = getValue(['product', 'item', 'productline', 'productname', 'prdouct', 'description', 'name'], 'product');
        const priceVal = getValue(['sales', 'price', 'amount', 'total', 'cost', 'value', 'revenue'], 'price');
        const country = getValue(['country', 'nation', 'region'], 'country');
        const status = getValue(['status', 'orderstatus', 'state', 'condition'], 'status');

        const price = parseFloat(priceVal.replace(/[$,]/g, '') || '0');
        
        if (!productName || isNaN(price)) {
          invalidRows.push({ index, row });
          return null;
        }

        return {
          orderNumber: orderNum || `UPLOAD-${Math.random().toString(36).substr(2, 9)}`,
          product: productName,
          price: price,
          date: dateStr || format(new Date(), 'yyyy-MM-dd'),
          lat: cityData.lat,
          lng: cityData.lng,
          city: cityName || cityData.name,
          country: country || cityData.country,
          status: status || 'Shipped'
        };
      }).filter((order): order is Order => order !== null);

      const missing = Object.entries(mappedFields)
        .filter(([_, found]) => !found)
        .map(([name]) => name);

      setUploadSummary({
        total: dataToProcess.length,
        originalTotal: originalTotal,
        isLimited: isLimited,
        valid: parsedData.length,
        invalid: invalidRows.length,
        missingFields: missing
      });

      if (parsedData.length === 0) {
        setUploadStatus('error');
        return;
      }

      if (!user) {
        setUploadStatus('error');
        alert('Please sign in to upload and save data.');
        return;
      }

      setUploadStatus('uploading');
      
      // Split into batches of 500 (Firestore limit)
      const BATCH_SIZE = 500;
      const totalBatches = Math.ceil(parsedData.length / BATCH_SIZE);
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = writeBatch(db);
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, parsedData.length);
        const chunk = parsedData.slice(start, end);
        
        chunk.forEach((order) => {
          const newDocRef = doc(collection(db, 'users', user.uid, 'orders'));
          batch.set(newDocRef, order);
        });
        
        try {
          await batch.commit();
        } catch (error: any) {
          if (error.message?.includes('quota') || error.message?.includes('resource-exhausted')) {
            setIsQuotaExceeded(true);
          }
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/orders`);
          break; // Stop processing batches if we hit quota
        }
        setUploadProgress(Math.round(((i + 1) / totalBatches) * 100));
        
        // Small delay to prevent overwhelming the connection
        if (totalBatches > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setUploadStatus('completed');
      setSearchTerm('');
      setProductFilter('All');
      setDateRange({ start: '', end: '' });
      setDatePreset('All');
      
    } catch (err: any) {
      console.error('Parsing Error:', err);
      setUploadStatus('error');
      const isQuotaError = err.message?.includes('quota') || err.message?.includes('resource-exhausted');
      if (isQuotaError) setIsQuotaExceeded(true);
      setUploadSummary(prev => ({
        total: data.length,
        valid: 0,
        invalid: data.length,
        missingFields: [],
        error: isQuotaError 
          ? 'Firestore Quota Exceeded. Please try again tomorrow or upgrade your plan.' 
          : 'Error parsing file. Please ensure it is a valid CSV or Excel format.'
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
          
          processParsedData(jsonData, headers);
        } catch (err) {
          console.error('Excel Parsing Error:', err);
          alert('Error reading Excel file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedData(results.data, results.meta.fields || []);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => {
          console.error('PapaParse Error:', error);
          alert('Error reading the CSV file.');
        }
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (filteredOrders.length === 0) return;

    const headers = ['Order Number', 'Product', 'Price', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(o => [
        o.orderNumber,
        `"${o.product}"`,
        `$${o.price.toFixed(2)}`,
        o.date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = async () => {
    if (isAuthInProgress) return;
    setAuthError(null);
    setIsAuthInProgress(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      if (result.accessToken) {
        setGoogleAccessToken(result.accessToken);
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      setAuthError(error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsAuthInProgress(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        if (!displayName.trim()) throw new Error('Please enter your name.');
        if (!username.trim()) throw new Error('Please enter a username.');
        const newUser = await signUpWithEmail(email, password, displayName, username);
        if (newUser) {
          const result = await sendVerificationCode(email, newUser.uid);
          setVerificationPreviewUrl(result.previewUrl);
          setVerificationStep('pending');
        }
      } else {
        const loggedInUser = await loginWithEmail(email, password);
        // Check if user is verified
        const userDoc = await getDoc(doc(db, 'users', loggedInUser.uid));
        if (userDoc.exists() && userDoc.data().isVerified === false) {
          await sendVerificationCode(email, loggedInUser.uid);
          setVerificationStep('pending');
        }
      }
    } catch (error: any) {
      let msg = 'Authentication failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please switch to "Log In" mode.';
      } else if (error.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password. If you are new here, please "Sign Up" first.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please sign up.';
      } else if (error.code === 'auth/wrong-password') {
        msg = 'Incorrect password. Please try again.';
      } else if (error.message && error.message.includes('SMTP')) {
        msg = 'Email service is not configured. Please check the "Secrets" in Settings.';
      } else {
        msg = error.message || msg;
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !enteredCode) return;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      await verifyCode(user.uid, enteredCode);
      setVerificationStep('none');
      setToast({ message: 'Email verified successfully!', type: 'success' });
    } catch (error: any) {
      setVerificationError(error.message || 'Failed to verify code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!user || !user.email) return;
    setIsVerifying(true);
    try {
      const result = await sendVerificationCode(user.email, user.uid);
      setVerificationPreviewUrl(result.previewUrl);
      setToast({ message: 'Verification code resent!', type: 'success' });
    } catch (error: any) {
      setVerificationError('Failed to resend code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setAuthError('Please enter your email address first.');
      return;
    }
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setAuthError('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      let msg = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email.';
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-[2rem] h-[2rem] border-4 border-[#141414]/10 border-t-[#141414] rounded-full"
        />
      </div>
    );
  }

  if (user && (verificationStep === 'pending' || (userProfile && userProfile.isVerified === false))) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-[1rem]">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white p-[2rem] sm:p-[3rem] border border-[#141414]/10 rounded-[1.5rem] shadow-2xl max-w-[32rem] w-full"
        >
          <div className="text-center mb-[2rem]">
            <div className="bg-[#141414] w-[3.5rem] h-[3.5rem] rounded-[1rem] flex items-center justify-center mx-auto mb-[1rem]">
              <ShieldCheck className="w-[1.75rem] h-[1.75rem] text-white" />
            </div>
            <h1 className="text-[1.75rem] font-bold mb-[0.25rem]">Verify Your Email</h1>
            <p className="text-[#141414]/60 text-[0.875rem]">
              We've sent a 6-digit verification code to <span className="font-bold text-[#141414]">{user.email}</span>.
            </p>
          </div>

          {verificationError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-[1.5rem] p-[0.75rem] bg-red-50 border border-red-100 rounded-[0.5rem] text-red-600 text-[0.8125rem] font-medium flex items-center gap-[0.5rem]"
            >
              <AlertCircle className="w-[1rem] h-[1rem]" />
              {verificationError}
            </motion.div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-[1.5rem]">
            <div>
              <label className="block text-[0.75rem] uppercase tracking-widest font-bold text-[#141414]/40 mb-[0.5rem]">
                Verification Code
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="000000" 
                required
                className="w-full px-[1rem] py-[1rem] bg-[#141414]/5 border border-transparent rounded-[0.75rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-mono text-[2rem] text-center tracking-[0.5rem] transition-all"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>

            <button 
              type="submit"
              disabled={isVerifying || enteredCode.length !== 6}
              className="w-full py-[1rem] bg-[#141414] text-white rounded-[0.75rem] font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-[2rem] flex flex-col gap-[1rem] text-center">
            <button 
              onClick={handleResendCode}
              disabled={isVerifying}
              className="text-[0.875rem] font-bold text-[#141414]/60 hover:text-[#141414] transition-colors"
            >
              Didn't receive the code? Resend
            </button>
            <button 
              onClick={() => {
                logout();
                setVerificationStep('none');
              }}
              className="text-[0.875rem] font-bold text-red-600/60 hover:text-red-600 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-[1rem]">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white p-[2rem] sm:p-[3rem] border border-[#141414]/10 rounded-[1.5rem] shadow-2xl max-w-[32rem] w-full"
        >
          <div className="text-center mb-[2rem]">
            <div className="bg-[#141414] w-[3.5rem] h-[3.5rem] rounded-[1rem] flex items-center justify-center mx-auto mb-[1rem]">
              <TrendingUp className="w-[1.75rem] h-[1.75rem] text-white" />
            </div>
            <h1 className="text-[1.75rem] font-bold mb-[0.25rem]">SalesPulse</h1>
            <p className="text-[#141414]/60 text-[0.875rem]">
              {authMode === 'login' ? 'Welcome back. Please log in.' : 'Create your account to get started.'}
            </p>
          </div>
          
          {authError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-[1.5rem] p-[0.75rem] bg-red-50 border border-red-100 rounded-[0.5rem] text-red-600 text-[0.8125rem] font-medium flex items-center gap-[0.5rem]"
            >
              <div className="w-[0.25rem] h-[0.25rem] bg-red-600 rounded-full" />
              {authError}
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-[1rem] mb-[1.5rem]">
            {authMode === 'signup' && (
              <>
                <div className="relative">
                  <UserCircle className="absolute left-[1rem] top-1/2 -translate-y-1/2 w-[1rem] h-[1rem] text-[#141414]/40" />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required
                    className="w-full pl-[2.75rem] pr-[1rem] py-[0.875rem] bg-[#141414]/5 border border-transparent rounded-[0.75rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium text-[0.875rem] transition-all"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-[1rem] top-1/2 -translate-y-1/2 text-[0.875rem] font-bold text-[#141414]/40">@</span>
                  <input 
                    type="text" 
                    placeholder="Username" 
                    required
                    className="w-full pl-[2.75rem] pr-[1rem] py-[0.875rem] bg-[#141414]/5 border border-transparent rounded-[0.75rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium text-[0.875rem] transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-[1rem] top-1/2 -translate-y-1/2 w-[1rem] h-[1rem] text-[#141414]/40" />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                className="w-full pl-[2.75rem] pr-[1rem] py-[0.875rem] bg-[#141414]/5 border border-transparent rounded-[0.75rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium text-[0.875rem] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-[1rem] top-1/2 -translate-y-1/2 w-[1rem] h-[1rem] text-[#141414]/40" />
              <input 
                type="password" 
                placeholder="Password" 
                required
                minLength={6}
                className="w-full pl-[2.75rem] pr-[1rem] py-[0.875rem] bg-[#141414]/5 border border-transparent rounded-[0.75rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium text-[0.875rem] transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {authMode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-[0.75rem] font-bold text-[#141414]/40 hover:text-[#141414] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[1rem] bg-[#141414] text-white rounded-[0.75rem] font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : (authMode === 'login' ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <div className="relative mb-[1.5rem]">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#141414]/10"></div>
            </div>
            <div className="relative flex justify-center text-[0.75rem] uppercase tracking-widest font-bold">
              <span className="bg-white px-[1rem] text-[#141414]/40">Or continue with</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogin}
            disabled={isAuthInProgress}
            className="w-full flex items-center justify-center gap-[0.75rem] px-[1.5rem] py-[0.875rem] bg-white border border-[#141414]/10 text-[#141414] rounded-[0.75rem] font-bold hover:bg-[#141414]/5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthInProgress ? (
              <Loader2 className="w-[1.25rem] h-[1.25rem] animate-spin text-[#141414]/40" />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-[1.25rem] h-[1.25rem]" alt="Google" />
            )}
            {isAuthInProgress ? 'Signing in...' : 'Google'}
          </button>
          
          <div className="mt-[2rem] text-center flex flex-col gap-[0.5rem]">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError(null);
              }}
              className="text-[1rem] sm:text-[0.875rem] font-bold text-[#141414]/60 hover:text-[#141414] transition-colors py-[0.5rem]"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
            <button 
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-[0.75rem] font-bold text-[#141414]/40 hover:text-[#141414] transition-colors"
            >
              Privacy Policy
            </button>
          </div>
          <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
        </motion.div>
      </div>
    );
  }

  const handleClearData = async () => {
    if (!user || allOrders.length === 0) return;
    setIsClearing(true);
    setClearProgress(0);
    try {
      // Firestore batches have a limit of 500 operations
      const BATCH_SIZE = 500;
      const totalBatches = Math.ceil(allOrders.length / BATCH_SIZE);
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = writeBatch(db);
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, allOrders.length);
        const chunk = allOrders.slice(start, end);
        
        chunk.forEach(o => {
          if (o.id) {
            batch.delete(doc(db, 'users', user.uid, 'orders', o.id));
          }
        });
        
        // Add the user profile update to the first batch
        if (i === 0) {
          batch.update(doc(db, 'users', user.uid), { hasSeeded: true });
        }
        
        try {
          await batch.commit();
        } catch (error: any) {
          if (error.message?.includes('quota') || error.message?.includes('resource-exhausted')) {
            setIsQuotaExceeded(true);
          }
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/orders`);
          break; // Stop processing batches if we hit quota
        }
        setClearProgress(Math.round(((i + 1) / totalBatches) * 100));
        
        // Small delay to prevent overwhelming the connection
        if (totalBatches > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setIsClearModalOpen(false);
      setToast({ message: 'All data has been cleared successfully.', type: 'success' });
    } catch (e: any) {
      console.error('Error clearing data:', e);
      const isQuotaError = e.message?.includes('quota') || e.message?.includes('resource-exhausted');
      if (isQuotaError) setIsQuotaExceeded(true);
      setToast({ 
        message: isQuotaError 
          ? 'Firestore Quota Exceeded. Please try again tomorrow or upgrade your plan.' 
          : 'Failed to clear data. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsClearing(false);
      setClearProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {isClearModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-[1rem]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isClearing && setIsClearModalOpen(false)}
              className="absolute inset-0 bg-[#141414]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white p-[2rem] border border-[#141414]/10 rounded-[1rem] shadow-2xl max-w-[28rem] w-full"
            >
              <div className="flex items-center gap-[1rem] mb-[1.5rem] text-red-600">
                <div className="p-[0.75rem] bg-red-50 rounded-full">
                  <Trash2 className="w-[1.5rem] h-[1.5rem]" />
                </div>
                <h3 className="text-[1.25rem] font-bold">Clear All Data?</h3>
              </div>
              
              <p className="text-[#141414]/60 mb-[2rem] leading-relaxed">
                This will permanently delete all <span className="font-bold text-[#141414]">{allOrders.length}</span> sales records from your account. This action cannot be undone.
              </p>

              {isClearing && (
                <div className="mb-[2rem]">
                  <div className="flex justify-between items-center mb-[0.5rem]">
                    <span className="text-[0.75rem] font-bold text-[#141414]/60 uppercase tracking-wider">Clearing Data...</span>
                    <span className="text-[0.75rem] font-bold text-[#F27D26]">{clearProgress}%</span>
                  </div>
                  <div className="h-[0.5rem] bg-[#141414]/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${clearProgress}%` }}
                      className="h-full bg-[#F27D26]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-[0.75rem]">
                <button 
                  disabled={isClearing}
                  onClick={() => setIsClearModalOpen(false)}
                  className="flex-1 px-[1rem] py-[1rem] sm:py-[0.75rem] bg-[#141414]/5 text-[#141414] rounded-[0.75rem] font-bold hover:bg-[#141414]/10 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button 
                  disabled={isClearing}
                  onClick={handleClearData}
                  className="flex-1 px-[1rem] py-[1rem] sm:py-[0.75rem] bg-red-600 text-white rounded-[0.75rem] font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-[0.5rem] active:scale-[0.98]"
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="w-[1rem] h-[1rem] animate-spin" />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-[1rem] h-[1rem]" />
                      <span>Delete All</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-[1rem]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white p-[2rem] border border-[#141414]/10 rounded-[1rem] shadow-2xl max-w-[24rem] w-full"
            >
              <h3 className="text-[1.25rem] font-bold mb-[1.5rem]">Profile Settings</h3>
              <div className="space-y-[1.5rem]">
                <div className="flex flex-col items-center gap-[1rem]">
                  <div className="relative group">
                    <div className="w-[5rem] h-[5rem] bg-[#F27D26] rounded-full flex items-center justify-center text-white font-bold text-[2rem] overflow-hidden border-2 border-[#141414]/5">
                      {(newPhoto || userProfile?.photoURL) ? (
                        <img src={newPhoto || userProfile?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        userProfile?.displayName?.charAt(0) || 'U'
                      )}
                    </div>
                    <button 
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-[0.4rem] bg-[#141414] text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Upload className="w-[0.75rem] h-[0.75rem]" />
                    </button>
                    <input 
                      type="file" 
                      ref={profilePhotoInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <p className="text-[0.7rem] text-[#141414]/40 font-medium">Click to upload new picture (max 150KB)</p>
                </div>

                <div>
                  <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-[#141414]/40 mb-[0.5rem]">Display Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-[1rem] py-[0.75rem] bg-[#141414]/5 border border-transparent rounded-[0.5rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold uppercase tracking-widest text-[#141414]/40 mb-[0.5rem]">Username</label>
                  <div className="relative">
                    <span className="absolute left-[1rem] top-1/2 -translate-y-1/2 text-[0.875rem] font-bold text-[#141414]/40">@</span>
                    <input 
                      type="text" 
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-[2.25rem] pr-[1rem] py-[0.75rem] bg-[#141414]/5 border border-transparent rounded-[0.5rem] focus:ring-2 focus:ring-[#141414]/10 focus:outline-none font-medium"
                      placeholder="username"
                    />
                  </div>
                </div>
                <div className="pt-[0.5rem] flex gap-[0.75rem]">
                  <button 
                    onClick={handleUpdateProfile}
                    className="flex-1 px-[1rem] py-[1rem] sm:py-[0.75rem] bg-[#141414] text-white rounded-[0.75rem] font-bold hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setNewPhoto(null);
                    }}
                    className="px-[1rem] py-[1rem] sm:py-[0.75rem] bg-[#141414]/5 text-[#141414] rounded-[0.75rem] font-bold hover:bg-[#141414]/10 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv" 
        className="hidden" 
      />

      <main className="max-w-[80rem] mx-auto px-[1rem] sm:px-[1.5rem] lg:px-[2rem] pt-[2.5rem] sm:pt-[2rem] pb-[2rem]">
        <AnimatePresence>
          {isQuotaExceeded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-[1.5rem] overflow-hidden"
            >
              <div className="bg-red-50 border border-red-200 rounded-[0.75rem] p-[1rem] flex items-start gap-[1rem] shadow-sm">
                <div className="bg-red-100 p-[0.5rem] rounded-[0.5rem]">
                  <AlertCircle className="w-[1.25rem] h-[1.25rem] text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[0.875rem] font-bold text-red-900 mb-[0.25rem]">Firestore Quota Exceeded</h3>
                  <p className="text-[0.8125rem] text-red-700 leading-relaxed">
                    The daily free tier write limit for this project has been reached. 
                    Some features like uploading CSVs, adding tasks, or clearing data will be disabled until the quota resets (usually at midnight US Pacific Time).
                  </p>
                </div>
                <button 
                  onClick={() => setIsQuotaExceeded(false)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-[1rem] h-[1rem]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Logo & User Section */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[1.5rem] mt-[0.5rem] sm:mt-0 mb-[2rem]"
        >
          <div className="flex items-center gap-[0.75rem]">
            <div className="bg-[#141414] p-[0.5rem] rounded-[0.5rem]">
              <TrendingUp className="w-[1.25rem] h-[1.25rem] text-white" />
            </div>
            <h1 className="text-[1.25rem] font-bold tracking-tight">SalesPulse</h1>
          </div>
          
          <div className="flex items-center gap-[1rem] bg-white px-[1rem] py-[0.5rem] border border-[#141414]/10 rounded-full shadow-sm">
            <div className="flex items-center gap-[0.5rem] border-r border-[#141414]/10 pr-[1rem]">
              <div className="w-[2rem] h-[2rem] bg-[#F27D26] rounded-full flex items-center justify-center text-white font-bold text-[0.875rem] overflow-hidden">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userProfile?.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[0.875rem] font-bold leading-tight">{userProfile?.displayName || 'User'}</span>
                {userProfile?.username && (
                  <span className="text-[0.65rem] font-bold text-[#141414]/40">@{userProfile.username}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-[0.5rem]">
              <button 
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setNewPhoto(null);
                }}
                className="p-[0.75rem] sm:p-[0.5rem] hover:bg-[#141414]/5 rounded-full transition-colors group"
                title="Profile Settings"
              >
                <Settings className="w-[1.25rem] h-[1.25rem] sm:w-[1.125rem] sm:h-[1.125rem] text-[#141414]/40 group-hover:text-[#141414]" />
              </button>
              <button 
                onClick={logout}
                className="p-[0.75rem] sm:p-[0.5rem] hover:bg-red-50 rounded-full transition-colors group"
                title="Logout"
              >
                <LogOut className="w-[1.25rem] h-[1.25rem] sm:w-[1.125rem] sm:h-[1.125rem] text-[#141414]/40 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Welcome Section */}
        {isOrdersLoading && (
          <div className="mb-4 p-4 bg-[#141414]/5 rounded-lg flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 bg-[#141414]/20 rounded-full animate-bounce" />
            <span className="text-sm font-medium text-[#141414]/60">Syncing real-time sales data...</span>
          </div>
        )}

        {/* Upload Feedback Section - Now as a Modal to prevent layout shifts */}
        <AnimatePresence>
          {uploadStatus !== 'idle' && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setUploadStatus('idle')}
                className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[32rem] bg-white border border-[#141414]/10 rounded-2xl shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setUploadStatus('idle')}
                  className="absolute top-4 right-4 p-1 hover:bg-[#141414]/5 rounded-full transition-colors z-10"
                >
                  <X className="w-4 h-4 text-[#141414]/40" />
                </button>

                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      uploadStatus === 'completed' ? 'bg-[#E7F9F0] text-[#10B981]' :
                      uploadStatus === 'error' ? 'bg-red-50 text-red-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {uploadStatus === 'parsing' || uploadStatus === 'uploading' ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : uploadStatus === 'completed' ? (
                        <CheckCircle className="w-7 h-7" />
                      ) : (
                        <AlertCircle className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[1.5rem] tracking-tight leading-tight">
                        {uploadStatus === 'parsing' && 'Analyzing File...'}
                        {uploadStatus === 'uploading' && 'Saving to Cloud...'}
                        {uploadStatus === 'completed' && 'Upload Successful!'}
                        {uploadStatus === 'error' && 'Upload Failed'}
                      </h3>
                      <p className="text-[0.875rem] text-[#141414]/40 font-medium">
                        {uploadStatus === 'parsing' && 'We are validating your data structure.'}
                        {uploadStatus === 'uploading' && 'Syncing records with your dashboard.'}
                        {uploadStatus === 'completed' && 'Your data is now live and updated.'}
                        {uploadStatus === 'error' && 'Something went wrong during the process.'}
                      </p>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-[#141414]/5 mb-8" />
                  
                  {(uploadStatus === 'parsing' || uploadStatus === 'uploading') && (
                    <div className="mb-8">
                      <div className="w-full bg-[#141414]/5 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-[#141414] h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="flex justify-between mt-3">
                        <p className="text-xs text-[#141414]/40 font-bold uppercase tracking-widest">
                          {uploadStatus === 'parsing' ? 'Parsing Data' : 'Uploading'}
                        </p>
                        <p className="text-xs text-[#141414] font-bold">{uploadProgress}%</p>
                      </div>
                    </div>
                  )}

                  {uploadSummary && (
                    <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-wider font-bold text-[#141414]/40 mb-1">
                          {uploadSummary.isLimited ? 'Processed Rows' : 'Total Rows'}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-[1.5rem] sm:text-[2rem] font-bold leading-none tracking-tighter">{uploadSummary.total}</p>
                          {uploadSummary.isLimited && (
                            <span className="text-[0.65rem] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">LIMIT</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-wider font-bold text-[#10B981]/60 mb-1">Valid</p>
                        <p className="text-[1.5rem] sm:text-[2rem] font-bold text-[#10B981] leading-none tracking-tighter">{uploadSummary.valid}</p>
                      </div>
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-wider font-bold text-red-600/60 mb-1">Invalid</p>
                        <p className="text-[1.5rem] sm:text-[2rem] font-bold text-red-600 leading-none tracking-tighter">{uploadSummary.invalid}</p>
                      </div>
                    </div>
                  )}

                  {uploadSummary?.isLimited && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 mb-6">
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Row Limit Reached</p>
                        <p className="text-[0.75rem] text-amber-700 mt-1 leading-relaxed">
                          Your file contains <span className="font-bold">{uploadSummary.originalTotal?.toLocaleString()}</span> rows. 
                          To maintain dashboard performance, we only extracted the first <span className="font-bold">5,000</span> rows.
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadSummary?.missingFields && uploadSummary.missingFields.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 mb-6">
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <Info className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Missing Columns Detected</p>
                        <p className="text-[0.75rem] text-amber-700 mt-1 leading-relaxed">
                          We couldn't find: <span className="font-bold">{uploadSummary.missingFields.join(', ')}</span>. 
                          Default values were applied to these fields.
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadSummary?.error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-[0.75rem] font-bold text-red-800 leading-relaxed">{uploadSummary.error}</p>
                    </div>
                  )}

                  {uploadStatus === 'completed' && (
                    <button 
                      onClick={() => setUploadStatus('idle')}
                      className="w-full py-4 bg-[#141414] text-white rounded-xl font-bold text-[0.875rem] hover:opacity-90 transition-all shadow-xl shadow-[#141414]/10 mt-2"
                    >
                      Done
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Dashboard Header & Actions */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-[2rem] flex flex-col gap-[1.5rem] relative z-50"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-[1rem]">
            <div>
              <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold tracking-tight mb-[0.25rem]">Dashboard Overview</h2>
              <p className="text-[#141414]/60 text-[0.875rem] sm:text-[1rem]">Welcome back. Here's what's happening with your sales today.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-[0.75rem] w-full lg:w-auto">
              <button 
                onClick={handleDownload}
                className="flex-1 sm:flex-none flex items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] bg-[#141414] text-white rounded-[0.75rem] font-bold text-[0.875rem] hover:opacity-90 active:scale-[0.95] transition-all shadow-md whitespace-nowrap"
              >
                <Download className="w-[1rem] h-[1rem]" />
                <span>Export Data</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isQuotaExceeded}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] bg-white border border-[#141414]/10 rounded-[0.75rem] font-bold text-[0.875rem] hover:bg-[#141414]/5 transition-all active:scale-[0.95] shadow-sm whitespace-nowrap ${isQuotaExceeded ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-[1rem] h-[1rem]" />
                <span>Upload CSV</span>
              </button>
              <button 
                onClick={handleGoogleDriveUpload}
                disabled={isQuotaExceeded || isAuthInProgress}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] bg-white border border-[#141414]/10 rounded-[0.75rem] font-bold text-[0.875rem] hover:bg-[#141414]/5 transition-all active:scale-[0.95] shadow-sm whitespace-nowrap ${isQuotaExceeded || isAuthInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAuthInProgress ? (
                  <Loader2 className="w-[1rem] h-[1rem] animate-spin" />
                ) : (
                  <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" className="w-[1rem] h-[1rem]" alt="Google Drive" />
                )}
                <span>Drive</span>
              </button>
              {allOrders.length > 0 && (
                <button 
                  onClick={() => setIsClearModalOpen(true)}
                  disabled={isQuotaExceeded}
                  className={`p-[0.75rem] bg-red-50 text-red-600 border border-red-100 rounded-[0.75rem] hover:bg-red-100 transition-all active:scale-[0.95] shadow-sm ${isQuotaExceeded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Clear All Data"
                >
                  <Trash2 className="w-[1.125rem] h-[1.125rem]" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-[#141414]/5 p-[0.75rem] sm:p-[1rem] rounded-[1rem] border border-[#141414]/5">
            <div className="flex flex-col gap-[0.75rem]">
              <div className="flex items-center gap-[0.5rem] mb-[0.25rem]">
                <Filter className="w-[0.875rem] h-[0.875rem] text-[#141414]/40" />
                <span className="text-[0.7rem] font-bold uppercase tracking-widest text-[#141414]/40">Filter Results</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[0.75rem]">
                <div className="relative col-span-1">
                  <select 
                    className="w-full appearance-none pl-[1rem] pr-[2.5rem] py-[0.75rem] bg-white border border-transparent rounded-[0.75rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/5 cursor-pointer text-[0.875rem] font-bold transition-all hover:border-[#141414]/10"
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                  >
                    {products.map(p => <option key={p} value={p}>{p === 'All' ? 'All Products' : p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-[0.75rem] top-1/2 -translate-y-1/2 w-[1rem] h-[1rem] pointer-events-none opacity-40" />
                </div>

                <div className="relative col-span-1">
                  <select 
                    className="w-full appearance-none pl-[1rem] pr-[2.5rem] py-[0.75rem] bg-white border border-transparent rounded-[0.75rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/5 cursor-pointer text-[0.875rem] font-bold transition-all hover:border-[#141414]/10"
                    value={datePreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                  >
                    <option value="All">All Time</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="This Month">This Month</option>
                    <option value="Last Month">Last Month</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                  <ChevronDown className="absolute right-[0.75rem] top-1/2 -translate-y-1/2 w-[1rem] h-[1rem] pointer-events-none opacity-40" />
                </div>

                <div className="grid grid-cols-2 gap-[0.75rem] sm:col-span-2">
                  <ModernDatePicker 
                    label="From" 
                    value={dateRange.start} 
                    onChange={(date) => {
                      setDateRange(prev => ({ ...prev, start: date }));
                      setDatePreset('Custom');
                    }} 
                    align="left"
                  />
                  <ModernDatePicker 
                    label="To" 
                    value={dateRange.end} 
                    onChange={(date) => {
                      setDateRange(prev => ({ ...prev, end: date }));
                      setDatePreset('Custom');
                    }} 
                    align="right"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.section 
          layout
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.5rem] mb-[2rem]"
        >
          <StatCard title="Total Revenue" value={stats.revenue} icon={DollarSign} trend="+12.5%" />
          <StatCard title="Total Orders" value={stats.orders} icon={ShoppingBag} trend="+8.2%" />
          <StatCard title="Avg. Order Value" value={stats.avgValue} icon={TrendingUp} />
          <StatCard title="Active Products" value={stats.products} icon={Users} />
        </motion.section>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.5rem] mb-[2rem]">
          {/* Revenue Over Time */}
          <motion.div 
            layout
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-2 bg-white p-[1.5rem] border border-[#141414]/10 rounded-[0.75rem] shadow-sm"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[1rem] mb-[1.5rem]">
              <h3 className="font-bold text-[1.125rem]">Revenue Trends</h3>
              <div className="flex items-center gap-[0.5rem] text-[0.75rem] font-medium text-[#141414]/60">
                <div className="w-[0.75rem] h-[0.75rem] bg-[#141414] rounded-full" />
                Daily Revenue
              </div>
            </div>
            <div className="h-[18rem] sm:h-[22rem] w-full relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={revenueByDate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#14141460' }}
                      tickFormatter={(val) => {
                        try {
                          const date = !isNaN(Number(val)) && Number(val) > 30000 
                            ? new Date((Number(val) - 25569) * 86400 * 1000)
                            : parseISO(val);
                          return format(date, 'MMM d');
                        } catch (e) {
                          return val;
                        }
                      }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#14141460' }}
                      tickFormatter={(val) => `$${val}`}
                      width={60}
                    />
                    <Tooltip 
                      cursor={{ fill: '#14141405' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #14141410', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          let dateLabel = label;
                          try {
                            const date = !isNaN(Number(label)) && Number(label) > 30000 
                              ? new Date((Number(label) - 25569) * 86400 * 1000)
                              : parseISO(label as string);
                            dateLabel = format(date, 'MMMM d, yyyy');
                          } catch (e) {}
                          return (
                            <div className="bg-white p-3 border border-[#14141410] rounded-lg shadow-xl">
                              <p className="font-bold mb-1">{dateLabel}</p>
                              <p className="text-[#F27D26] font-bold">Revenue: ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              <p className="text-[#14141460] text-xs">Volume: {data.orders} Orders</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#141414" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#141414' }}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </motion.div>

            {/* Status Distribution */}
            <motion.div 
              layout
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="bg-white p-[1.5rem] border border-[#141414]/10 rounded-[0.75rem] shadow-sm"
            >
              <h3 className="font-bold text-[1.125rem] mb-[1.5rem]">Order Status Distribution</h3>
              <div className="h-[18rem] sm:h-[22rem] w-full relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-[#14141410] rounded-lg shadow-xl">
                              <p className="font-bold mb-1">{data.name}</p>
                              <p className="text-[#F27D26] font-bold">Volume: {data.value.toLocaleString()} Orders</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontFamily: 'Poppins, sans-serif', fontSize: '12px', paddingTop: '20px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.5rem] mb-[2rem]">
            {/* Sales by Product */}
            <motion.div 
              layout
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.1 }}
              className="bg-white p-[1rem] sm:p-[1.5rem] border border-[#141414]/10 rounded-[0.75rem] shadow-sm"
            >
              <h3 className="font-bold text-[1.125rem] mb-[1.5rem]">Sales by Product</h3>
              <div className="h-[14rem] sm:h-[16rem] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={salesByProduct} layout="vertical" margin={{ left: -30, right: 30, top: 0, bottom: 0 }} barCategoryGap="10%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#14141410" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#14141460' }} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#141414', fontWeight: 500 }}
                      width={120}
                    />
                    <Tooltip 
                      cursor={{ fill: '#14141405' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #14141410', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}
                      formatter={(value: any, name: string, props: any) => {
                        if (name === 'Sales') {
                          return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Sales'];
                        }
                        return [value, name];
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-[#14141410] rounded-lg shadow-xl">
                              <p className="font-bold mb-1">{label}</p>
                              <p className="text-[#F27D26] font-bold">Sales: ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              <p className="text-[#14141460] text-xs">Volume: {data.orders} Orders</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="Sales"
                      fill="#141414" 
                      radius={[0, 4, 4, 0]} 
                      barSize={24}
                      activeBar={{ fill: '#F27D26' }}
                      shape={<AnimatedBar layout="vertical" />}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Countries by Sales */}
            <motion.div 
              layout
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="lg:col-span-2 bg-white p-[1rem] sm:p-[1.5rem] border border-[#141414]/10 rounded-[0.75rem] shadow-sm"
            >
              <h3 className="font-bold text-[1.125rem] mb-[1.5rem]">Top Countries by Sales</h3>
              <div className="h-[14rem] sm:h-[16rem] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={salesByCountry} margin={{ left: 10, right: 30, top: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#141414', fontWeight: 500 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#14141460' }}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#14141405' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-[#14141410] rounded-lg shadow-xl">
                              <p className="font-bold mb-1">{label}</p>
                              <p className="text-[#F27D26] font-bold">Sales: ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              <p className="text-[#14141460] text-xs">Volume: {data.orders} Orders</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#141414" 
                      radius={[4, 4, 0, 0]} 
                      barSize={24}
                      activeBar={{ fill: '#F27D26' }}
                      shape={<AnimatedBar layout="horizontal" />}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

        {/* Daily Sales Tasks */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mb-[2rem] relative z-40 overflow-visible"
        >
          <div className="bg-white p-[1rem] sm:p-[1.5rem] border border-[#141414]/10 rounded-[0.75rem] shadow-sm overflow-visible">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[1rem] mb-[1.5rem]">
              <div className="flex items-center gap-[0.75rem]">
                <div className="p-[0.5rem] bg-[#141414]/5 rounded-[0.5rem]">
                  <ListTodo className="w-[1.25rem] h-[1.25rem] text-[#141414]" />
                </div>
                <h3 className="font-bold text-[1.125rem]">Daily Sales Tasks</h3>
              </div>
              <div className="flex items-center gap-[0.5rem] bg-[#141414]/5 p-[0.25rem] rounded-[0.5rem] self-start sm:self-auto">
                <button 
                  onClick={() => setTaskSortBy('date')}
                  className={`px-[0.75rem] py-[0.25rem] rounded-[0.375rem] text-[0.75rem] font-bold transition-all ${taskSortBy === 'date' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                >
                  By Date
                </button>
                <button 
                  onClick={() => setTaskSortBy('priority')}
                  className={`px-[0.75rem] py-[0.25rem] rounded-[0.375rem] text-[0.75rem] font-bold transition-all ${taskSortBy === 'priority' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                >
                  By Priority
                </button>
              </div>
            </div>

            <TaskForm onAddTask={handleAddTask} isQuotaExceeded={isQuotaExceeded} />

            <div className="space-y-[0.75rem]">
              <AnimatePresence mode="popLayout">
                {sortedTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-[2rem] text-[#141414]/40"
                  >
                    <p className="text-[0.875rem]">No tasks for today. Great job!</p>
                  </motion.div>
                ) : (
                  sortedTasks.map((task) => (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: task.completed ? 0.6 : 1, 
                        y: 0,
                        scale: task.completed ? 0.98 : 1,
                        backgroundColor: task.completed ? 'rgba(20, 20, 20, 0.05)' : 'rgba(255, 255, 255, 1)'
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center justify-between p-[1rem] rounded-[0.75rem] border transition-all ${
                        task.completed 
                          ? 'border-transparent' 
                          : 'border-[#141414]/10 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-[0.5rem] sm:gap-[1rem] flex-1">
                        <div className="flex items-center gap-[1rem]">
                          <button 
                            onClick={() => handleToggleTask(task.id, task.completed)}
                            className={`transition-colors relative ${task.completed ? 'text-emerald-600' : 'text-[#141414]/20 hover:text-[#141414]/40'}`}
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={task.completed ? 'checked' : 'unchecked'}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                {task.completed ? <CheckCircle2 className="w-[1.25rem] h-[1.25rem]" /> : <Circle className="w-[1.25rem] h-[1.25rem]" />}
                              </motion.div>
                            </AnimatePresence>
                          </button>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-[0.5rem] flex-wrap">
                              <span className="relative">
                                <span className={`text-[0.875rem] font-medium truncate block ${task.completed ? 'text-[#141414]/40' : ''}`}>
                                  {task.text}
                                </span>
                                {task.completed && (
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    className="absolute left-0 top-1/2 h-[1px] bg-[#141414]/40"
                                  />
                                )}
                              </span>
                              {task.priority && (
                                <span className={`shrink-0 px-[0.5rem] py-[0.125rem] rounded-full text-[0.625rem] font-bold uppercase tracking-wider ${
                                  task.priority === 'High' ? 'bg-red-100 text-red-600' :
                                  task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ModernDateDisplay dueDate={task.dueDate} completed={task.completed} />
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-[0.5rem] text-[#141414]/20 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-[1rem] h-[1rem]" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        {/* Geographical Distribution */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mb-[2rem] relative z-30"
        >
          <div className="bg-white p-[1rem] sm:p-[1.5rem] border border-[#141414]/10 rounded-[0.75rem] shadow-sm">
            <h3 className="font-bold text-[1.125rem] mb-[1.5rem]">Geographical Distribution</h3>
            <div className="h-[25rem] sm:h-[30rem] w-full">
              <SalesMap orders={filteredOrders} />
            </div>
          </div>
        </motion.section>

        {/* Data Table */}
        <motion.section 
          layout
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="bg-white border border-[#141414]/10 rounded-[0.75rem] shadow-sm overflow-hidden relative z-20"
        >
          <div className="p-[1.5rem] border-b border-[#141414]/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-[1rem]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-[1rem] w-full lg:w-auto">
              <div className="flex items-center gap-[0.5rem] flex-shrink-0">
                <FileText className="w-[1.25rem] h-[1.25rem] text-[#141414]/40" />
                <h3 className="font-bold text-[1.125rem]">Recent Transactions</h3>
              </div>
              <SearchInput value={searchTerm} onChange={setSearchTerm} />
            </div>
            <span className="text-[0.7rem] font-medium text-[#141414]/40 uppercase tracking-widest whitespace-nowrap">
              Showing {Math.min(filteredOrders.length, 10)} of {filteredOrders.length} filtered orders
            </span>
          </div>
          <div className="overflow-x-auto min-h-[32rem]">
            <table className="w-full text-left border-collapse min-w-[50rem]">
              <thead>
                <tr className="bg-[#141414]/5">
                  <th 
                    className="w-[12%] px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-[#141414]/40 cursor-pointer hover:text-[#141414] transition-colors group/th"
                    onClick={() => handleSort('orderNumber')}
                  >
                    <div className="flex items-center gap-1">
                      Order ID
                      {sortConfig?.key === 'orderNumber' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="w-[20%] px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-[#141414]/40 cursor-pointer hover:text-[#141414] transition-colors group/th"
                    onClick={() => handleSort('product')}
                  >
                    <div className="flex items-center gap-1">
                      Product
                      {sortConfig?.key === 'product' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="w-[15%] px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-[#141414]/40 cursor-pointer hover:text-[#141414] transition-colors group/th"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center gap-1">
                      City
                      {sortConfig?.key === 'city' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="w-[15%] px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-[#141414]/40 cursor-pointer hover:text-[#141414] transition-colors group/th"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortConfig?.key === 'date' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="w-[13%] px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-[#141414]/40 cursor-pointer hover:text-[#141414] transition-colors group/th"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortConfig?.key === 'status' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="w-[10%] px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-[#141414]/40 cursor-pointer hover:text-[#141414] transition-colors group/th text-right"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Price
                      {sortConfig?.key === 'price' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/5">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-[10rem] text-center">
                      <div className="inline-flex items-center justify-center w-[3rem] h-[3rem] rounded-full bg-[#141414]/5 mb-[1rem]">
                        <Filter className="w-[1.5rem] h-[1.5rem] opacity-20" />
                      </div>
                      <p className="text-[#141414]/40 font-medium">No orders found matching your filters.</p>
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setProductFilter('All');
                          setDateRange({ start: '', end: '' });
                          setDatePreset('All');
                        }}
                        className="mt-[1rem] text-[0.875rem] font-bold underline decoration-[#141414]/20 hover:decoration-[#141414] transition-all"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 10).map((order) => (
                    <motion.tr 
                      key={order.id || `${order.orderNumber}-${order.product}-${order.date}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#141414]/5 transition-colors group cursor-default"
                    >
                      <td className="px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.8125rem] sm:text-[0.875rem] font-mono font-medium">{order.orderNumber}</td>
                      <td className="px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.8125rem] sm:text-[0.875rem] font-medium">{order.product}</td>
                      <td className="px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.8125rem] sm:text-[0.875rem] text-[#141414]/60">{order.city}</td>
                      <td className="px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.8125rem] sm:text-[0.875rem] text-[#141414]/60">
                        {(() => {
                          try {
                            return format(parseISO(order.date), 'MMM d, yyyy');
                          } catch (e) {
                            return order.date;
                          }
                        })()}
                      </td>
                      <td className="px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem]">
                        <span className={`text-[0.65rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          order.status === 'Shipped' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'Disputed' ? 'bg-red-50 text-red-600' :
                          order.status === 'In Process' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'On Hold' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-[1rem] sm:px-[1.5rem] py-[0.75rem] sm:py-[1rem] text-[0.8125rem] sm:text-[0.875rem] font-mono font-bold text-right">${order.price.toFixed(2)}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="max-w-[80rem] mx-auto px-[1rem] sm:px-[1.5rem] lg:px-[2rem] py-[4rem] border-t border-[#141414]/10">
        <div className="flex flex-col items-center text-center gap-[2rem]">
          <div className="space-y-[1rem]">
            <p className="font-bold text-[1.25rem] text-[#141414]">Created by Irfan Khattak</p>
            <div className="flex flex-wrap justify-center items-center gap-[1.5rem] text-[0.875rem] text-[#141414]/60">
              <a href="mailto:ifnkhattak@outlook.com" className="flex items-center gap-[0.5rem] hover:text-[#141414] transition-colors">
                <Mail className="w-[1rem] h-[1rem]" />
                ifnkhattak@outlook.com
              </a>
              <a href="https://www.linkedin.com/in/irfan-khattak-00b847251" target="_blank" rel="noopener noreferrer" className="flex items-center gap-[0.5rem] hover:text-[#141414] transition-colors">
                <Linkedin className="w-[1rem] h-[1rem]" />
                LinkedIn Profile
              </a>
              <a href="https://github.com/Irfan-code-cloud" target="_blank" rel="noopener noreferrer" className="flex items-center gap-[0.5rem] hover:text-[#141414] transition-colors">
                <Github className="w-[1rem] h-[1rem]" />
                GitHub Profile
              </a>
            </div>
          </div>
          <p className="text-[0.75rem] text-[#141414]/30 uppercase tracking-widest font-bold">
            © 2026 SalesPulse Analytics Engine. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-[2rem] left-1/2 z-[300] w-full max-w-[20rem] px-[1rem]"
          >
            <div className={`flex items-center gap-[0.75rem] p-[1rem] rounded-[0.75rem] shadow-2xl border ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="w-[1.25rem] h-[1.25rem]" /> : <AlertCircle className="w-[1.25rem] h-[1.25rem]" />}
              <p className="text-[0.875rem] font-bold">{toast.message}</p>
              <button 
                onClick={() => setToast(null)}
                className="ml-auto p-[0.25rem] hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-[1rem] h-[1rem]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
