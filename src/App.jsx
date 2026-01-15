import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building, 
  User, 
  ShieldCheck, 
  Search,
  Plus,
  RefreshCw,
  UserCog,
  UserCheck,
  Star,
  UserPlus,
  LayoutGrid,
  ClipboardList,
  CheckSquare,
  Square,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Home,
  BarChart3,
  Lock,
  KeyRound,
  Users,
  LogOut,
  CreditCard,
  BadgeCheck,
  UserCircle2,
  AlertTriangle,
  Globe,
  Languages
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCWtXJTLnG-EonlKFqn9RJTQcyZaCIAj-Y",
  authDomain: "dorm-inspect-udg.firebaseapp.com",
  projectId: "dorm-inspect-udg",
  storageBucket: "dorm-inspect-udg.firebasestorage.app",
  messagingSenderId: "920926960599",
  appId: "1:920926960599:web:b1e3ec184b80de7198e992",
  measurementId: "G-NFZ66NNYW3"
};

// Use initializeFirestore with long polling to prevent connection timeouts
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants & Utilities ---
const BUILDINGS = ['Dorm A', 'Dorm B', 'Dorm D', 'Dorm T'];

// Security Codes for Roles
const SECURITY_CODES = {
  admin: '9999',
  intendant: '8888',
  responsible: '1111'
};

// Intendant Allocations
const INTENDANT_ALLOCATIONS = {
  "Galina Berov": ["Dorm A", "Dorm B"],
  "Svetlana Namesnic": ["Dorm D", "Dorm T"]
};

// Custom layout configuration
const CUSTOM_LAYOUTS = {
  'Dorm A': [
    '300', '301', '302', 
    '303', '304', '305', 
    '306', '307', '308', 
    '309', '310', '311'
  ],
  'Dorm B': [
    '501', '502', '503', '504', '505', 
    '512', '513', '514', '515', 
    '601', '604', '606', 
    '607', '608', '609'
  ],
  'Dorm T': ['1', '2', '3', '4', '5', '6', '7'],
  'Dorm D': [
    'Ap 1', 'Ap 2', 
    'Ap 3', 'Ap 4', 'Ap 5', 
    'Ap 6', 'Ap 7', 'Ap 8', 
    'Ap 9', 'Ap 10', 'Ap 11'
  ]
};

// --- PRE-ASSIGNED RESIDENTS CONFIGURATION ---
const ROOM_ASSIGNMENTS = {
  'Dorm A': {
    '300': ['KHON TIMOFEY', 'BURKHANOV JAHONGIR', 'YERGALI ILIYAS', 'MURODALIZODA SHAHZOD'],
    '301': ['ASSETOV MUSSA', 'DALUBAYEV AKHTAN', 'NOJKIN DANIIL', 'ODINAEV HOJIMAHMUD'],
    '302': ['BÎSTRICA EDUARD', 'MALANCEA DANIEL'],
    '303': ['YERKEGALIYEV AZAMAT', 'MUSTAFIN DANIIL', 'TENTIMISHEV ARSENII', 'TENTIMISHEV ELDIIAR', 'USAROV JOKHONGIR', 'SHARIPOV RASSUL', 'YANGIBOEV ILYAS'],
    '304': ['VOZNIUC DMITRII', 'KOVALETS DMITRIY', 'MURODALIZODA SHAHZOD', 'KHON TIMOFEY'],
    '305': ['BABENKO VLADYSLAV', 'MAKARENKO ARTEMII', 'SHONAZAROV SAMUIL'],
    '306': ['ADVAHOV STANISLAV', 'BATÎR TEOFIL', 'GRECU DMITRI', 'CUCOȘ MARC', 'MATASARU MAREC', 'PLETOSU DENIS', 'PĂDURE VLAD'],
    '307': ['GAFFAR BEIBARYS', 'DZHUMAEV SHAKHZOD', 'NAZARENKO ILLIA', 'SHELEPANOV NAZAR'],
    '308': ['BAGIROV RUVIM', 'BURDUN ANDRII', 'BUREACOV NICOLAI', 'ESENTUROV AKTAN', 'SABLIN ALEKSEY', 'TAJIMURATOV DONIYOR', 'KHASHIMOV ROMAN'],
    '309': ['GOLOBORODKO DIMITRY', 'RESHETNIKOV ALEXEY', 'SAFIN RAFAEL', 'CHYZH MYKHAILO'],
    '310': ['BALTABAEV DAURAN', 'ZHENGIS ZANGGAR', 'JUMABAEV KAKHARMAN', 'KARABLUD DMYTRO', 'KURBONBOEV ASADBEK'],
    '311': ['BUNCHENKO ARTUR', 'YERGALI ILIYAS', 'YERGALI MUSSA', 'PANAITOV ILLIA']
  },
  'Dorm B': {
    '501': ['AMOAȘII ANASTASIA', 'ASSANBEKOVA AZHAR', 'BÎRNAT LIVIA', 'SALEȚKAIA ANA-MARIA'],
    '502': ['JULEA OXANA', 'MAKARENKO DIANA', 'TOPAL MARINA'],
    '503': ['CRECIUN CRISTINA', 'PACHA IANA', 'SAVCHENKO HANNA', 'SIDORKO YEKATERINA'],
    '504': ['SAUKHAMBEKOVA RUFINA', 'TOPAL MARGARETA', 'SHELEPANOVA VIRSAVIYA'],
    '505': ['AINASHOVA DILNAZ', 'ARABOVA ROKHILAKHON', 'MUKAY BALAUSSA'],
    '512': ['BLOȘENCO GABRIELA', 'VÎLCU ADRIANA', 'UZENOVA DANIELLA'],
    '513': ['MUTRUC LIDIANA', 'RYSBEKOVA DARIIA', 'SYTNYK ZHANNA'],
    '514': ['AKMATBEKOVA AINAZIK', 'GULOVA AZIZA', 'UZUN TAMARA'],
    '515': ['ASKAROVA DARIGA', 'MUSURMANOVA LILIIA'],
    '601': ['KIRYUKHINA ALENA', 'MINENKOVA KARINA'],
    '604': ['AZIZOVA SITORA', 'GERINA SARA', 'KUZMENKO VALERIYA', 'SATRIDINOVA ZARINA'],
    '606': ['KHON ESFIR', 'KHUSNULLINA ALINA'],
    '607': ['ABDULLOEVA SHAHZODA', 'FAKHRIDINOVA ANASTASIYA', 'MENZHERES DARYNA', 'RAZAKOVA MEKHRONA'],
    '608': ['GOROBATÎI MIHAELA', 'HONCHARUK VALERIIA', 'POLUCCIU GABRIELA'],
    '609': ['AVCI ROJDA', 'BIBAS DIANA', 'SUMAN DORINA']
  },
  'Dorm T': {},
  'Dorm D': {}
};

// --- RESPONSIBLE STAFF ALLOCATION ---
const RESPONSIBLE_ALLOCATIONS = {
  "BM23TJ0185BJ": "Dorm A", // BURKHANOV JAHONGIR
  "SW23MD0195TM": "Dorm B", // TOPAL MARINA
  "MI25KZ0323PD": "Dorm T", // PLOTNIKOV DMITRIY
};

// --- STUDENT ID DATABASE ---
const STUDENT_ID_MAP = {
  "BM23KZ0164AM": "ASSETOV MUSSA",
  "BM23MD0165AA": "AMOAȘII ANASTASIA",
  "SW23MD0168AR": "AVCI ROJDA",
  "SW23MD0170BD": "BIBAS DIANA",
  "BM23MD0173CD": "CHEPTENARI DANIEL",
  "BM23MD0174VV": "VASILENCO VIRGINIA",
  "BM23MD0175MD": "MALANCEA DANIEL",
  "BM23MD0176CC": "CRECIUN CRISTINA",
  "SW23UZ0180KT": "KHON TIMOFEY",
  "SW23MD0181SA": "SACAL ANGHELINA",
  "SW23MD0182UT": "UZUN TAMARA",
  "SW23TJ0184GA": "GULOVA AZIZA",
  "BM23TJ0185BJ": "BURKHANOV JAHONGIR",
  "BM23TJ0186AS": "ABDULLOEVA SHAHZODA",
  "MI23KZ0188YI": "YERGALI ILIYAS",
  "MI23TJ0190MS": "MURODALIZODA SHAHZOD",
  "BM23TJ0193AD": "ABDURAKHMONOV DAMIR",
  "MI23KZ0194RA": "RESHETNIKOV ALEXEY",
  "SW23MD0195TM": "TOPAL MARINA",
  "BM23UZ0196KS": "KIM SHOKHRUKH",
  "BM23UA0197SV": "SHTIVELMAN (KURKOTOVA) VALERIIA",
  "BM23UZ0198AR": "ARABOVA ROKHILAKHON",
  "BM23KG0199RD": "RYSBEKOVA DARIIA",
  "BM23MD0200BL": "BÎRNAT LIVIA",
  "BM23UZ0201BD": "BALTABAEV DAURAN",
  "MI23UZ0203UJ": "USAROV JOKHONGIR",
  "MI23UZ0204YI": "YANGIBOEV ILYAS",
  "MI23UZ0205JK": "JUMABAEV KAKHARMAN",
  "SW23MD0206UA": "UNGUREANU (IZBEȘCIUC) ANASTASIA",
  "SW23MD0207CA": "CUȘCEVAIA ANNA",
  "MI24RU0209MD": "MAKARENKO DIANA",
  "SW24RU0210MA": "MAKARENKO ARTEMII",
  "SW24RU0211PI": "PACHA IANA",
  "SW24UA0212SH": "SAVCHENKO HANNA",
  "SW24KG0213SS": "SHONAZAROV SAMUIL",
  "SW24KG0215UD": "UZENOVA DANIELLA",
  "MI24UZ0216MD": "MUSTAFIN DANIIL",
  "MI24TJ0217OH": "ODINAEV HOJIMAHMUD",
  "BM24KG0218AA": "AKMATBEKOVA AINAZIK",
  "BM24KG0219AD": "ASKAROVA DARIGA",
  "BM24KZ0220AA": "ASSANBEKOVA AZHAR",
  "BM24UZ0221AS": "AZIZOVA SITORA",
  "MI24TJ0224DS": "DZHUMAEV SHAKHZOD",
  "BM24UZ0225KA": "KURBONBOEV ASADBEK",
  "BM24KG0226ML": "MUSURMANOVA LILIIA",
  "BM24UA0227NI": "NAZARENKO ILLIA",
  "BM24UZ0228ND": "NOJKIN DANIIL",
  "BM24TJ0229RM": "RAZAKOVA MEKHRONA",
  "BM24UZ0230SR": "SAFIN RAFAEL",
  "BM24KZ0231SY": "SIDORKO YEKATERINA",
  "BM24KZ0232SN": "SHELEPANOV NAZAR",
  "BM24UA0233SZ": "SYTNYK ZHANNA",
  "BM24UZ0234TD": "TAJIMURATOV DONIYOR",
  "BM24KZ0236UD": "UZOKBAYEV DAUTBEK",
  "TE24MD0237BE": "BÎSTRICA EDUARD",
  "TE24MD0239MM": "MATASARU MAREC",
  "BM24MD0240PG": "POLUCCIU GABRIELA",
  "BM24MD0241PM": "POPERECINÎI MELISA",
  "BM24MD0242SN": "SAVACENCU NICOLAE",
  "SW24UA0243BV": "BABENKO VLADYSLAV",
  "SW24MD0244JO": "JULEA OXANA",
  "SW24MD0245BG": "BLOȘENCO GABRIELA",
  "SW24MD0247GM": "GOROBATÎI MIHAELA",
  "SW24MD0248ML": "MUTRUC LIDIANA",
  "SW24MD0249SD": "SUMAN DORINA",
  "MI24MD0250AS": "ADVAHOV STANISLAV",
  "TE24MD0251PV": "PĂDURE VLAD",
  "MI24MD0252BN": "BUREACOV NICOLAI",
  "SW24MD0253VA": "VÎLCU ADRIANA",
  "BM24MD0254SA": "SALEȚKAIA ANA-MARIA",
  "MI24UA0257CM": "CHYZH MYKHAILO",
  "MI24US0208GD": "GOLOBORODKO DIMITRY",
  "MI25KG0315BA": "BUNCHENKO ARTUR",
  "MI25MD0317CM": "CUCOȘ MARC",
  "MI25KZ0318GS": "GERINA SARA",
  "MI25US0319KA": "KIRYUKHINA ALENA",
  "MI25RU0320MA": "METSO ANASTASIA",
  "MI25UA0321PI": "PANAITOV ILLIA",
  "MI25MD0322PD": "PLETOSU DENIS",
  "MI25KZ0323PD": "PLOTNIKOV DMITRIY",
  "MI25KG0324TE": "TENTIMISHEV ELDIIAR",
  "MI25MD0325VD": "VOZNIUC DMITRII",
  "MI25KZ0326YM": "YERGALI MUSSA",
  "SW25UZ0327EA": "EMSHANOVA ALINA",
  "SW25UA0328HV": "HONCHARUK VALERIIA",
  "SW25UA0329KD": "KARABLUD DMYTRO",
  "SW25UA0330MD": "MENZHERES DARYNA",
  "SW25KZ0331MB": "MUKAY BALAUSSA",
  "BM25KZ0334AD": "AINASHOVA DILNAZ",
  "BM25UZ0335BR": "BAGIROV RUVIM",
  "BM25UA0336BA": "BURDUN ANDRII",
  "MI25KZ0337DA": "DALUBAYEV AKHTAN",
  "BM25KG0338EA": "ESENTUROV AKTAN",
  "BM25TJ0339FA": "FAKHRIDINOVA ANASTASIYA",
  "BM25KZ0340GB": "GAFFAR BEIBARYS",
  "BM25MD0341GD": "GRECU DMITRI",
  "BM25UZ0342KE": "KHON ESFIR",
  "BM25UZ0343KA": "KHUSNULLINA ALINA",
  "BM25KZ0344KD": "KOVALETS DMITRIY",
  "BM25KG0345KV": "KUZMENKO VALERIYA",
  "BM25RU0346MK": "MINENKOVA KARINA",
  "BM25UZ0347SA": "SABLIN ALEKSEY",
  "BM25KG0348SZ": "SATRIDINOVA ZARINA",
  "BM25KZ0349SR": "SAUKHAMBEKOVA RUFINA",
  "BM25KZ0350SR": "SHARIPOV RASSUL",
  "BM25KZ0351SV": "SHELEPANOVA VIRSAVIYA",
  "BM25UA0352SA": "SOKOLOV ALBERT",
  "BM25KG0353TA": "TENTIMISHEV ARSENII",
  "BM25MD0354TM": "TOPAL MARGARETA",
  "BM25KZ0355YA": "YERKEGALIYEV AZAMAT",
  "BM25KZ0356ZZ": "ZHENGIS ZANGGAR",
  "BM25MD0357BD": "BODAREV DANIEL",
  "MI25MD0359BT": "BATÎR TEOFIL",
  "BM25KZ0365KR": "KHASHIMOV ROMAN"
};

// Resident Data Registry (For Autocomplete) - Derived from ROOM_ASSIGNMENTS for display
const RESIDENTS_DATA = {
  'Dorm A': Object.values(ROOM_ASSIGNMENTS['Dorm A']).flat(),
  'Dorm B': Object.values(ROOM_ASSIGNMENTS['Dorm B']).flat(),
  'Dorm D': [],
  'Dorm T': []
};

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  en: {
    appTitle: "Dorm Inspect UDG",
    welcome: "Welcome to Dorm Inspect UDG",
    overview: "Overview for",
    startInspection: "Start Inspection",
    inspectionDate: "Select Inspection Date",
    pending: "Pending",
    clean: "Clean",
    issuesFound: "Issues Found",
    globalAvg: "Global Avg",
    buildingPerformance: "Building Performance",
    evaluated: "evaluated",
    
    // Roles
    roleStudent: "Student",
    roleResponsible: "Responsible",
    roleIntendant: "Intendant",
    roleAdmin: "Global Admin",
    
    // Auth/Login
    studentAccess: "Student Access",
    studentInstruction: "Enter your Student ID to view your room status",
    studentIdLabel: "Student ID",
    studentIdPlaceholder: "e.g. BM23KZ0164AM",
    caseInsensitive: "Case insensitive (e.g. bm23... works)",
    findMyRoom: "Find My Room",
    
    responsibleAccess: "Responsible Staff Access",
    responsibleInstruction: "Verify your identity to manage your building",
    enterStudentId: "Enter Your Student ID",
    accessBuilding: "Access Building",
    
    intendantAccess: "Intendant Access",
    intendantInstruction: "Who is inspecting today?",
    oversees: "Oversees",
    
    securityCheck: "Security Check",
    restrictedAccess: "Restricted Access",
    enterSecurityCode: "Enter security code to access",
    securityCodeLabel: "Security Code",
    enterPin: "Enter 4-digit PIN",
    incorrectCode: "Incorrect code provided.",
    cancel: "Cancel",
    accessDashboard: "Access Dashboard",
    
    // Tracker/Dashboard
    backToDashboard: "Back to Dashboard",
    exitRoomView: "Exit Room View",
    inspection: "Inspection",
    myRoomStatus: "My Room Status",
    allBuildings: "All Buildings",
    searchPlaceholder: "Search room number or resident...",
    noRoomsFound: "No rooms found matching your search.",
    dataMismatch: "Data mismatch detected.",
    updateBuildingNames: "Update Building Names (Reset)",
    
    // Header Info
    managedAccess: "Managed Access",
    viewingAssigned: "Viewing assigned building only.",
    switchId: "Switch ID",
    viewing: "Viewing",
    switchUser: "Switch User",
    globalAdminView: "Global Admin View",
    viewingAll: "Viewing all dorms and data.",
    
    // Room Status
    statusClean: "Clean",
    statusDirty: "Needs Cleaning",
    statusAttention: "Needs Inspection",
    statusProgress: "In Progress",
    
    // Evaluation Modal
    evaluationStatus: "Evaluation Status",
    responsibleStudent: "Responsible Student",
    selectStudent: "Select student responsible for cleaning today...",
    typeToSearch: "Type to search or add name...",
    evaluationScore: "Evaluation Score",
    rateCleanliness: "Rate cleanliness from 1 (Poor) to 5 (Excellent)",
    commonIssues: "Common Issues Checklist",
    setStatus: "Set Status",
    passed: "Passed",
    failed: "Failed",
    inProgress: "In Progress",
    flagged: "Flagged",
    additionalNotes: "Additional Notes",
    specificComments: "Specific comments...",
    saveEvaluation: "Save Evaluation",
    close: "Close",
    requestInspection: "Request Inspection",
    studentRequestText: "Students can request an inspection. The responsible staff will review the request.",
    
    // Initialization
    dbEmpty: "Database is Empty",
    dbEmptyMsg: "The room registry has not been initialized yet. Please click below to generate the rooms for Buildings A, B, D and T.",
    initializeDb: "Initialize Room Database",
    resetRegistry: "Reset Registry",
    resetting: "Resetting...",
    
    // Issues
    issue_vacuum: "Floor not vacuumed",
    issue_mop: "Floor not mopped",
    issue_trash: "Trash overflow",
    issue_dishes: "Dirty dishes",
    issue_dust: "Dusty surfaces",
    issue_window: "Window dirty",
    issue_bed: "Unmade bed",
    issue_odor: "Bad odor",
    issue_clutter: "Clutter obstructing path"
  },
  ro: {
    appTitle: "Dorm Inspect UDG",
    welcome: "Bine ați venit la Dorm Inspect UDG",
    overview: "Prezentare generală pentru",
    startInspection: "Începe Inspecția",
    inspectionDate: "Selectați Data Inspecției",
    pending: "În Așteptare",
    clean: "Curat",
    issuesFound: "Probleme Găsite",
    globalAvg: "Media Globală",
    buildingPerformance: "Performanța Căminelor",
    evaluated: "evaluate",
    
    // Roles
    roleStudent: "Student",
    roleResponsible: "Responsabil",
    roleIntendant: "Intendent",
    roleAdmin: "Admin Global",
    
    // Auth/Login
    studentAccess: "Acces Student",
    studentInstruction: "Introduceți ID-ul de student pentru a vedea statusul camerei",
    studentIdLabel: "ID Student",
    studentIdPlaceholder: "ex. BM23KZ0164AM",
    caseInsensitive: "Nu contează majusculele (ex. bm23... merge)",
    findMyRoom: "Găsește Camera Mea",
    
    responsibleAccess: "Acces Personal Responsabil",
    responsibleInstruction: "Verificați identitatea pentru a gestiona clădirea",
    enterStudentId: "Introduceți ID-ul de Student",
    accessBuilding: "Acces Clădire",
    
    intendantAccess: "Acces Intendent",
    intendantInstruction: "Cine inspectează astăzi?",
    oversees: "Supraveghează",
    
    securityCheck: "Verificare Securitate",
    restrictedAccess: "Acces Restricționat",
    enterSecurityCode: "Introduceți codul de securitate pentru modul",
    securityCodeLabel: "Cod Securitate",
    enterPin: "Introduceți PIN din 4 cifre",
    incorrectCode: "Cod incorect.",
    cancel: "Anulează",
    accessDashboard: "Accesează Dashboard",
    
    // Tracker/Dashboard
    backToDashboard: "Înapoi la Dashboard",
    exitRoomView: "Ieșire Vizualizare Cameră",
    inspection: "Inspecție",
    myRoomStatus: "Statusul Camerei Mele",
    allBuildings: "Toate Căminele",
    searchPlaceholder: "Caută număr cameră sau rezident...",
    noRoomsFound: "Nu s-au găsit camere conform căutării.",
    dataMismatch: "Nepotrivire de date detectată.",
    updateBuildingNames: "Actualizare Nume Cămine (Resetare)",
    
    // Header Info
    managedAccess: "Acces Gestionat",
    viewingAssigned: "Vizualizare doar pentru clădirea atribuită.",
    switchId: "Schimbă ID",
    viewing: "Vizualizare",
    switchUser: "Schimbă Utilizator",
    globalAdminView: "Vizualizare Admin Global",
    viewingAll: "Vizualizare toate căminele și datele.",
    
    // Room Status
    statusClean: "Curat",
    statusDirty: "Necesită Curățenie",
    statusAttention: "Necesită Inspecție",
    statusProgress: "În Progres",
    
    // Evaluation Modal
    evaluationStatus: "Status Evaluare",
    responsibleStudent: "Student Responsabil",
    selectStudent: "Selectează studentul responsabil pentru curățenie azi...",
    typeToSearch: "Tastați pentru a căuta sau adăuga nume...",
    evaluationScore: "Scor Evaluare",
    rateCleanliness: "Evaluează curățenia de la 1 (Slab) la 5 (Excelent)",
    commonIssues: "Listă Probleme Comune",
    setStatus: "Setează Status",
    passed: "Admis",
    failed: "Respins",
    inProgress: "În Progres",
    flagged: "Semnalat",
    additionalNotes: "Note Aditionale",
    specificComments: "Comentarii specifice...",
    saveEvaluation: "Salvează Evaluarea",
    close: "Închide",
    requestInspection: "Solicită Inspecție",
    studentRequestText: "Studenții pot solicita o inspecție. Personalul responsabil va revizui cererea.",
    
    // Initialization
    dbEmpty: "Baza de date este goală",
    dbEmptyMsg: "Registrul camerelor nu a fost inițializat încă. Vă rugăm să faceți clic mai jos pentru a genera camerele pentru Căminele A, B, D și T.",
    initializeDb: "Inițializează Baza de Date Camere",
    resetRegistry: "Resetează Registrul",
    resetting: "Se resetează...",
    
    // Issues
    issue_vacuum: "Podea neaspirată",
    issue_mop: "Podea nespălată",
    issue_trash: "Gunoi nedu",
    issue_dishes: "Vase murdare",
    issue_dust: "Suprafețe prăfuite",
    issue_window: "Geam murdar",
    issue_bed: "Pat ne făcut",
    issue_odor: "Miros neplăcut",
    issue_clutter: "Dezordine blocând calea"
  },
  ru: {
    appTitle: "Dorm Inspect UDG",
    welcome: "Добро пожаловать в Dorm Inspect UDG",
    overview: "Обзор за",
    startInspection: "Начать проверку",
    inspectionDate: "Выберите дату проверки",
    pending: "Ожидает",
    clean: "Чисто",
    issuesFound: "Найдены проблемы",
    globalAvg: "Общий средний балл",
    buildingPerformance: "Показатели по общежитиям",
    evaluated: "проверено",
    
    // Roles
    roleStudent: "Студент",
    roleResponsible: "Ответственный",
    roleIntendant: "Комендант",
    roleAdmin: "Глобальный Админ",
    
    // Auth/Login
    studentAccess: "Вход для студентов",
    studentInstruction: "Введите студенческий ID для просмотра статуса комнаты",
    studentIdLabel: "Студенческий ID",
    studentIdPlaceholder: "напр. BM23KZ0164AM",
    caseInsensitive: "Регистр не важен (напр. bm23... работает)",
    findMyRoom: "Найти мою комнату",
    
    responsibleAccess: "Вход для ответственных",
    responsibleInstruction: "Подтвердите личность для управления зданием",
    enterStudentId: "Введите ваш студенческий ID",
    accessBuilding: "Доступ к зданию",
    
    intendantAccess: "Вход для коменданта",
    intendantInstruction: "Кто проводит проверку сегодня?",
    oversees: "Курирует",
    
    securityCheck: "Проверка безопасности",
    restrictedAccess: "Ограниченный доступ",
    enterSecurityCode: "Введите код безопасности для доступа к режиму",
    securityCodeLabel: "Код безопасности",
    enterPin: "Введите 4-значный PIN",
    incorrectCode: "Неверный код.",
    cancel: "Отмена",
    accessDashboard: "Войти в панель",
    
    // Tracker/Dashboard
    backToDashboard: "Назад в панель",
    exitRoomView: "Выйти из просмотра комнаты",
    inspection: "Проверка",
    myRoomStatus: "Статус моей комнаты",
    allBuildings: "Все здания",
    searchPlaceholder: "Поиск по номеру комнаты или жильцу...",
    noRoomsFound: "Комнаты не найдены.",
    dataMismatch: "Обнаружено несоответствие данных.",
    updateBuildingNames: "Обновить названия зданий (Сброс)",
    
    // Header Info
    managedAccess: "Управляемый доступ",
    viewingAssigned: "Просмотр только назначенного здания.",
    switchId: "Сменить ID",
    viewing: "Просмотр",
    switchUser: "Сменить пользователя",
    globalAdminView: "Вид глобального администратора",
    viewingAll: "Просмотр всех общежитий и данных.",
    
    // Room Status
    statusClean: "Чисто",
    statusDirty: "Нужна уборка",
    statusAttention: "Нужна проверка",
    statusProgress: "В процессе",
    
    // Evaluation Modal
    evaluationStatus: "Статус оценки",
    responsibleStudent: "Ответственный студент",
    selectStudent: "Выберите студента, ответственного за уборку сегодня...",
    typeToSearch: "Введите имя для поиска или добавления...",
    evaluationScore: "Оценка",
    rateCleanliness: "Оцените чистоту от 1 (Плохо) до 5 (Отлично)",
    commonIssues: "Список частых проблем",
    setStatus: "Установить статус",
    passed: "Сдано",
    failed: "Не сдано",
    inProgress: "В процессе",
    flagged: "Отмечено",
    additionalNotes: "Дополнительные заметки",
    specificComments: "Конкретные комментарии...",
    saveEvaluation: "Сохранить оценку",
    close: "Закрыть",
    requestInspection: "Запросить проверку",
    studentRequestText: "Студенты могут запросить проверку. Ответственный персонал рассмотрит запрос.",
    
    // Initialization
    dbEmpty: "База данных пуста",
    dbEmptyMsg: "Реестр комнат еще не инициализирован. Нажмите ниже, чтобы сгенерировать комнаты для общежитий A, B, D и T.",
    initializeDb: "Инициализировать базу комнат",
    resetRegistry: "Сбросить реестр",
    resetting: "Сброс...",
    
    // Issues
    issue_vacuum: "Пол не пропылесошен",
    issue_mop: "Пол не помыт",
    issue_trash: "Мусор переполнен",
    issue_dishes: "Грязная посуда",
    issue_dust: "Пыльные поверхности",
    issue_window: "Грязное окно",
    issue_bed: "Кровать не заправлена",
    issue_odor: "Неприятный запах",
    issue_clutter: "Беспорядок мешает проходу"
  }
};

const COMMON_ISSUES = [
  'Floor not vacuumed',
  'Floor not mopped',
  'Trash overflow',
  'Dirty dishes',
  'Dusty surfaces',
  'Window dirty',
  'Unmade bed',
  'Bad odor',
  'Clutter obstructing path'
];

// Map the english strings to translation keys
const ISSUE_KEY_MAP = {
  'Floor not vacuumed': 'issue_vacuum',
  'Floor not mopped': 'issue_mop',
  'Trash overflow': 'issue_trash',
  'Dirty dishes': 'issue_dishes',
  'Dusty surfaces': 'issue_dust',
  'Window dirty': 'issue_window',
  'Unmade bed': 'issue_bed',
  'Bad odor': 'issue_odor',
  'Clutter obstructing path': 'issue_clutter'
};

const STATUS_CONFIG = {
  clean: { labelKey: 'statusClean', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2, ring: 'ring-emerald-500' },
  dirty: { labelKey: 'statusDirty', color: 'bg-rose-100 text-rose-800', icon: Trash2, ring: 'ring-rose-500' },
  attention: { labelKey: 'statusAttention', color: 'bg-amber-100 text-amber-800', icon: AlertCircle, ring: 'ring-amber-500' },
  progress: { labelKey: 'statusProgress', color: 'bg-blue-100 text-blue-800', icon: Clock, ring: 'ring-blue-500' }
};

const ROLE_LABELS = {
  student: { labelKey: 'roleStudent', icon: User },
  responsible: { labelKey: 'roleResponsible', icon: UserCheck },
  intendant: { labelKey: 'roleIntendant', icon: UserCog },
  admin: { labelKey: 'roleAdmin', icon: Globe }
};

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  
  let date;
  try {
    if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput && typeof dateInput.seconds === 'number') {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('ro-RO', {
      weekday: 'short', month: 'short', day: 'numeric'
    }).format(date);
  } catch (e) {
    console.error("Date formatting error", e);
    return '';
  }
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Components ---

const StatusBadge = ({ status, t }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.progress;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={14} />
      {t(config.labelKey)}
    </span>
  );
};

const StarRating = ({ rating, setRating, readonly = false, size = 16 }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && setRating(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star 
            size={size} 
            className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-300'}`} 
          />
        </button>
      ))}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Plus className="rotate-45 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Evaluation Form Component ---
const EvaluationForm = ({ 
  room, 
  onClose, 
  updateRoomStatus, 
  isIntendant, 
  residentSuggestions,
  t
}) => {
  const [status, setStatus] = useState(room.status);
  const [notes, setNotes] = useState(room.notes || '');
  const [score, setScore] = useState(room.score || 0);
  
  const initialResident = Array.isArray(room.residentName) ? '' : (room.residentName || '');
  const [residentName, setResidentName] = useState(initialResident);
  
  const [selectedIssues, setSelectedIssues] = useState(room.issues || []);
  
  const roomSpecificResidents = ROOM_ASSIGNMENTS[room.building]?.[room.number];
  const hasSpecificList = Array.isArray(roomSpecificResidents);

  const toggleIssue = (issue) => {
    if (selectedIssues.includes(issue)) {
      setSelectedIssues(selectedIssues.filter(i => i !== issue));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const handleSave = () => {
     updateRoomStatus(room.id, status, notes, score, isIntendant ? residentName : null, selectedIssues);
  };

  return (
     <div className="space-y-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${STATUS_CONFIG[status] ? STATUS_CONFIG[status].color : STATUS_CONFIG.progress.color}`}>
             {React.createElement(STATUS_CONFIG[status] ? STATUS_CONFIG[status].icon : STATUS_CONFIG.progress.icon, { size: 24 })}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">{t('evaluationStatus')}</p>
            <p className="font-bold text-gray-900">{t(STATUS_CONFIG[status] ? STATUS_CONFIG[status].labelKey : 'statusProgress')}</p>
          </div>
          {score > 0 && (
            <div className="ml-auto flex flex-col items-end">
              <p className="text-xs text-gray-500 uppercase font-semibold">Score</p>
              <div className="flex items-center text-amber-500 font-bold">
                 <Star size={14} className="fill-current mr-1" />
                 {score}/5
              </div>
            </div>
          )}
        </div>

        {isIntendant && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users size={16} />
              {t('responsibleStudent')}
            </label>
            <div className="relative">
              {hasSpecificList ? (
                <div className="relative">
                  <select
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    className="w-full pl-3 pr-8 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="">{t('selectStudent')}</option>
                    {roomSpecificResidents.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={16} />
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="text" 
                    list="resident-suggestions"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    placeholder={t('typeToSearch')}
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <datalist id="resident-suggestions">
                     {residentSuggestions && residentSuggestions.map((name, index) => (
                        <option key={`${name}-${index}`} value={name} />
                     ))}
                  </datalist>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">{t('evaluationScore')}</label>
           <div className="flex items-center gap-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100 justify-center">
              <StarRating rating={score} setRating={setScore} size={28} />
              <span className="text-lg font-bold text-yellow-700 w-8 text-center">{score > 0 ? score : '-'}</span>
           </div>
           <p className="text-xs text-center text-gray-500 mt-1">{t('rateCleanliness')}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ClipboardList size={16} />
            {t('commonIssues')}
          </label>
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
             {COMMON_ISSUES.map(issue => {
               const isChecked = selectedIssues.includes(issue);
               return (
                 <button
                  key={issue}
                  onClick={() => toggleIssue(issue)}
                  className={`flex items-start gap-2 text-left p-1.5 rounded transition-colors ${isChecked ? 'bg-rose-50 text-rose-800 font-medium' : 'text-gray-600 hover:bg-gray-200'}`}
                 >
                   {isChecked ? (
                     <CheckSquare size={16} className="text-rose-500 shrink-0 mt-0.5" />
                   ) : (
                     <Square size={16} className="text-gray-400 shrink-0 mt-0.5" />
                   )}
                   <span className="text-xs leading-tight">{t(ISSUE_KEY_MAP[issue]) || issue}</span>
                 </button>
               );
             })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">{t('setStatus')}</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setStatus('clean')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${status === 'clean' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <CheckCircle2 className="mb-1" />
              <span className="text-sm font-semibold">{t('passed')}</span>
            </button>

            <button 
              onClick={() => setStatus('dirty')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${status === 'dirty' ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <Trash2 className="mb-1" />
              <span className="text-sm font-semibold">{t('failed')}</span>
            </button>

             <button 
              onClick={() => setStatus('progress')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${status === 'progress' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <Clock className="mb-1" />
              <span className="text-sm font-semibold">{t('inProgress')}</span>
            </button>

            <button 
              onClick={() => setStatus('attention')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${status === 'attention' ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <AlertCircle className="mb-1" />
              <span className="text-sm font-semibold">{t('flagged')}</span>
            </button>
          </div>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('additionalNotes')}</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              rows="2"
              placeholder={t('specificComments')}
            ></textarea>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors border border-gray-200"
          >
            {t('cancel')}
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {t('saveEvaluation')}
          </button>
        </div>
     </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [staticRooms, setStaticRooms] = useState([]);
  const [dailyInspections, setDailyInspections] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Language State
  const [language, setLanguage] = useState('en');

  // Translation Helper
  const t = (key) => TRANSLATIONS[language][key] || key;

  // States
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBuilding, setSelectedBuilding] = useState('All');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [userRole, setUserRole] = useState('student');
  const [selectedRoom, setSelectedRoom] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentSelectedRoomId, setStudentSelectedRoomId] = useState(null);

  const [responsibleBuilding, setResponsibleBuilding] = useState(null);
  const [currentIntendant, setCurrentIntendant] = useState(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [authInput, setAuthInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Constants
  const canManage = ['intendant', 'responsible', 'admin'].includes(userRole);
  const isIntendant = userRole === 'intendant' || userRole === 'admin';
  const isAdmin = userRole === 'admin';
  
  // Merged Data Logic
  const mergedRooms = useMemo(() => {
    return staticRooms.map(room => {
      const inspection = dailyInspections[room.id];
      if (inspection) {
        return {
          ...room,
          ...inspection, 
          id: room.id, 
          residentName: inspection.residentNameSnapshot || room.residentName
        };
      } else {
        return {
          ...room,
          status: 'progress', 
          score: 0,
          notes: '',
          issues: [],
          lastUpdated: null,
          updatedBy: null
        };
      }
    });
  }, [staticRooms, dailyInspections]);

  // Role-Based Room Filtering Logic
  const roleFilteredRooms = useMemo(() => {
    if (userRole === 'admin') return mergedRooms;
    if (userRole === 'student' && studentSelectedRoomId) return mergedRooms.filter(r => r.id === studentSelectedRoomId);
    if (userRole === 'responsible' && responsibleBuilding) return mergedRooms.filter(r => r.building === responsibleBuilding);
    if (userRole === 'intendant' && currentIntendant) {
      const allowedBuildings = INTENDANT_ALLOCATIONS[currentIntendant] || [];
      return mergedRooms.filter(r => allowedBuildings.includes(r.building));
    }
    return mergedRooms;
  }, [mergedRooms, userRole, studentSelectedRoomId, responsibleBuilding, currentIntendant]);

  // UI Filtering Logic (Search & Tabs)
  const filteredRooms = useMemo(() => {
    let data = [...roleFilteredRooms];
    data.sort((a, b) => {
      if (a.building === b.building) {
        if (a.building === 'Dorm D') {
           const numA = parseInt(a.number.replace('Ap ', '')) || 0;
           const numB = parseInt(b.number.replace('Ap ', '')) || 0;
           return numA - numB;
        }
        return a.number.length - b.number.length || a.number.localeCompare(b.number, undefined, { numeric: true });
      }
      return a.building.localeCompare(b.building);
    });
    return data.filter(room => {
      const matchesBuilding = selectedBuilding === 'All' || room.building === selectedBuilding;
      const matchesSearch = room.number.includes(searchQuery) || 
                           room.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (typeof room.residentName === 'string' && room.residentName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesBuilding && matchesSearch;
    });
  }, [roleFilteredRooms, selectedBuilding, searchQuery]);

  // Stats Logic
  const stats = useMemo(() => {
    const sourceData = roleFilteredRooms;
    const total = sourceData.length;
    const clean = sourceData.filter(r => r.status === 'clean').length;
    const dirty = sourceData.filter(r => r.status === 'dirty').length;
    const attention = sourceData.filter(r => r.status === 'attention').length;
    const progress = sourceData.filter(r => r.status === 'progress').length;
    const scoredRooms = sourceData.filter(r => r.score && r.score > 0);
    const avgScore = scoredRooms.length > 0 
      ? (scoredRooms.reduce((acc, curr) => acc + curr.score, 0) / scoredRooms.length).toFixed(1)
      : '0.0';
    return { total, clean, dirty, attention, progress, avgScore };
  }, [roleFilteredRooms]);

  // Building Averages Logic
  const buildingStats = useMemo(() => {
    const acc = {
      'Dorm A': { total: 0, count: 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      'Dorm B': { total: 0, count: 0, color: 'text-rose-600', bg: 'bg-rose-50' },
      'Dorm D': { total: 0, count: 0, color: 'text-amber-600', bg: 'bg-amber-50' },
      'Dorm T': { total: 0, count: 0, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    };

    roleFilteredRooms.forEach(room => {
      if (room.score > 0 && acc[room.building]) {
        acc[room.building].total += room.score;
        acc[room.building].count++;
      }
    });

    return Object.entries(acc)
      .map(([name, data]) => ({
        name,
        avg: data.count > 0 ? (data.total / data.count).toFixed(1) : '0.0',
        ...data
      }))
      .filter(b => {
        if (userRole === 'admin') return true;
        if (userRole === 'responsible' && responsibleBuilding) return b.name === responsibleBuilding;
        if (userRole === 'intendant' && currentIntendant) return INTENDANT_ALLOCATIONS[currentIntendant]?.includes(b.name);
        return true;
      });
  }, [roleFilteredRooms, userRole, responsibleBuilding, currentIntendant]);

  // ... (Hooks for Auth, Data fetching, Seed logic - UNCHANGED) ...
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
        setErrorMsg("Authentication failed. Please refresh.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const roomsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'dorm-rooms');
    const unsubscribe = onSnapshot(roomsCollection, (snapshot) => {
      const roomData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaticRooms(roomData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const inspectionsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'inspections');
    const q = query(inspectionsCollection, where('date', '==', selectedDate));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inspectionMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        inspectionMap[data.roomId] = data;
      });
      setDailyInspections(inspectionMap);
    }, (error) => {
      console.error("Error fetching inspections:", error);
    });
    return () => unsubscribe();
  }, [user, selectedDate]);

  const seedData = async () => {
    if (!user) return;
    setLoading(true);
    const batch = writeBatch(db);
    for (const building of BUILDINGS) {
      if (CUSTOM_LAYOUTS[building]) {
        for (const roomNum of CUSTOM_LAYOUTS[building]) {
           let floor = 1;
           if (building === 'Dorm D') {
             const num = parseInt(roomNum.replace('Ap ', ''));
             if (num <= 2) floor = 1;
             else if (num <= 5) floor = 2;
             else if (num <= 8) floor = 3;
             else floor = 4;
           } else {
             floor = roomNum.length < 3 ? 1 : parseInt(roomNum.charAt(0));
           }

           const roomId = `${building.replace(/\s+/g, '')}_${roomNum.replace(/\s+/g, '')}`;
           const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'dorm-rooms', roomId);
           
           let preAssigned = ROOM_ASSIGNMENTS[building]?.[roomNum] || '';
           if (Array.isArray(preAssigned)) preAssigned = ''; 

           batch.set(docRef, {
            number: roomNum,
            building: building,
            floor: floor,
            residentName: preAssigned,
            createdAt: serverTimestamp()
          });
        }
      }
    }
    await batch.commit();
    setLoading(false);
  };

  const resetData = async () => {
    if (!user || !confirm("Are you sure? This will reset the ROOM REGISTRY.")) return;
    setIsResetting(true);
    try {
      const deleteBatch = writeBatch(db);
      staticRooms.forEach(room => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'dorm-rooms', room.id);
        deleteBatch.delete(ref);
      });
      await deleteBatch.commit();
      await seedData();
    } catch (err) {
      console.error("Error resetting:", err);
      alert("Failed to reset data.");
    }
    setIsResetting(false);
  };

  const updateRoomStatus = async (roomId, newStatus, notes = '', newScore = null, newResidentName = null, newIssues = null) => {
    if (!user) return;
    
    let updaterLabel = 'System';
    if (userRole === 'admin') updaterLabel = 'Global Admin';
    else if (userRole === 'intendant') updaterLabel = 'Intendant';
    else if (userRole === 'responsible') updaterLabel = 'Resp. Student';
    else if (userRole === 'student') updaterLabel = 'Student Request';

    try {
      const inspectionId = `${selectedDate}_${roomId}`;
      const inspectionRef = doc(db, 'artifacts', appId, 'public', 'data', 'inspections', inspectionId);
      
      const updatePayload = {
        date: selectedDate,
        roomId: roomId,
        status: newStatus,
        lastUpdated: serverTimestamp(),
        updatedBy: updaterLabel,
        notes: notes
      };

      if (newScore !== null) updatePayload.score = newScore;
      if (newIssues !== null) updatePayload.issues = newIssues;
      
      if (newResidentName !== null) {
        updatePayload.residentNameSnapshot = newResidentName;
      } else {
        const currentRoom = staticRooms.find(r => r.id === roomId);
        if (currentRoom) updatePayload.residentNameSnapshot = currentRoom.residentName;
      }

      await setDoc(inspectionRef, updatePayload, { merge: true });

      if (newResidentName !== null) {
        const staticRoomRef = doc(db, 'artifacts', appId, 'public', 'data', 'dorm-rooms', roomId);
        await updateDoc(staticRoomRef, { residentName: newResidentName });
      }
      setSelectedRoom(null);
    } catch (err) {
      console.error("Error updating room:", err);
    }
  };

  // ... (Other handlers unchanged)
  const handleDateChange = (offset) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const requestRoleChange = (role) => {
    if (role === 'student') {
      setUserRole('student');
      setStudentSelectedRoomId(null);
      setStudentIdInput('');
      setCurrentView('dashboard');
      return;
    }
    setResponsibleBuilding(null);
    setCurrentIntendant(null);
    setPendingRole(role);
    setAuthInput('');
    setAuthError(false);
    setIsAuthModalOpen(true);
  };

  const confirmRoleChange = () => {
    if (SECURITY_CODES[pendingRole] === authInput) {
      setUserRole(pendingRole);
      setStudentSelectedRoomId(null);
      setResponsibleBuilding(null);
      setCurrentIntendant(null);
      setCurrentView('dashboard');
      setIsAuthModalOpen(false);
    } else {
      setAuthError(true);
    }
  };

  const handleStudentIdLookup = () => {
    const cleanId = studentIdInput.trim().toUpperCase();
    if (!cleanId) return;

    const studentName = STUDENT_ID_MAP[cleanId];
    if (!studentName) {
      alert("Student ID not found in database.");
      return;
    }

    let foundRoom = null;
    let foundBuilding = null;

    for (const [building, rooms] of Object.entries(ROOM_ASSIGNMENTS)) {
      for (const [roomNum, residents] of Object.entries(rooms)) {
        if (Array.isArray(residents) && residents.includes(studentName)) {
          foundRoom = roomNum;
          foundBuilding = building;
          break;
        }
      }
      if (foundRoom) break;
    }

    if (foundRoom && foundBuilding) {
      const targetId = `${foundBuilding.replace(/\s+/g, '')}_${foundRoom.replace(/\s+/g, '')}`;
      const roomExists = staticRooms.some(r => r.id === targetId);
      if (roomExists) {
        setStudentSelectedRoomId(targetId);
        setCurrentView('tracker');
      } else {
        alert(`Configuration Error: Assigned room ${foundRoom} in ${foundBuilding} does not exist in registry.`);
      }
    } else {
      alert(`Welcome ${studentName}. You are not currently assigned to a room in the system.`);
    }
  };

  const handleResponsibleIdLookup = () => {
    const cleanId = studentIdInput.trim().toUpperCase();
    if (!cleanId) return;

    const assignedBuilding = RESPONSIBLE_ALLOCATIONS[cleanId];
    
    if (assignedBuilding) {
      setResponsibleBuilding(assignedBuilding);
      setSelectedBuilding(assignedBuilding); 
      setSearchQuery('');
    } else {
      alert("Access Denied: This Student ID is not authorized as a Responsible Staff member.");
    }
  };

  const handleIntendantSelection = (name) => {
    setCurrentIntendant(name);
    setSelectedBuilding('All');
  };

  if (loading && staticRooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Connecting to Dorm Inspect UDG...</p>
      </div>
    );
  }

  // --- Views ---

  const DashboardView = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('welcome')}</h2>
        <p className="text-gray-600">{t('overview')} <span className="font-semibold text-indigo-600">{formatDate(selectedDate)}</span></p>
      </div>

      {userRole === 'student' ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-md mx-auto">
           <div className="bg-indigo-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                 <User size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t('studentAccess')}</h3>
              <p className="text-indigo-100 text-sm">{t('studentInstruction')}</p>
           </div>
           
           <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('studentIdLabel')}</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStudentIdLookup()}
                    placeholder={t('studentIdPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none uppercase"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">{t('caseInsensitive')}</p>
              </div>

              <button 
                onClick={handleStudentIdLookup}
                disabled={!studentIdInput}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
              >
                {t('findMyRoom')}
                <ArrowRight size={18} />
              </button>
           </div>
        </div>
      ) : userRole === 'responsible' && !responsibleBuilding ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-md mx-auto animate-in zoom-in-95 duration-300">
           <div className="bg-emerald-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                 <BadgeCheck size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t('responsibleAccess')}</h3>
              <p className="text-emerald-100 text-sm">{t('responsibleInstruction')}</p>
           </div>
           
           <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('enterStudentId')}</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResponsibleIdLookup()}
                    placeholder="e.g. BM23TJ0185BJ"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none uppercase"
                  />
                </div>
              </div>

              <button 
                onClick={handleResponsibleIdLookup}
                disabled={!studentIdInput}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
              >
                {t('accessBuilding')}
                <ArrowRight size={18} />
              </button>
           </div>
        </div>
      ) : userRole === 'intendant' && !currentIntendant ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-md mx-auto animate-in zoom-in-95 duration-300">
           <div className="bg-blue-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                 <UserCog size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t('intendantAccess')}</h3>
              <p className="text-blue-100 text-sm">{t('intendantInstruction')}</p>
           </div>
           
           <div className="p-6 space-y-3">
              {Object.keys(INTENDANT_ALLOCATIONS).map((name) => (
                <button
                  key={name}
                  onClick={() => handleIntendantSelection(name)}
                  className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                      <UserCircle2 size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500">{t('oversees')}: {INTENDANT_ALLOCATIONS[name].join(', ')}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500" />
                </button>
              ))}
           </div>
        </div>
      ) : (
        // STAFF DASHBOARD (Authenticated)
        <>
          {userRole === 'responsible' && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-800">
               <div className="flex items-center gap-3">
                 <BadgeCheck className="text-emerald-600" />
                 <div>
                   <p className="font-bold">{t('managedAccess')}: {responsibleBuilding}</p>
                   <p className="text-xs opacity-80">{t('viewingAssigned')}</p>
                 </div>
               </div>
               <button 
                 onClick={() => setResponsibleBuilding(null)}
                 className="text-xs bg-white/50 hover:bg-white px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
               >
                 {t('switchId')}
               </button>
            </div>
          )}

          {userRole === 'intendant' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-blue-800">
               <div className="flex items-center gap-3">
                 <UserCog className="text-blue-600" />
                 <div>
                   <p className="font-bold">{t('roleIntendant')}: {currentIntendant}</p>
                   <p className="text-xs opacity-80">{t('viewing')}: {INTENDANT_ALLOCATIONS[currentIntendant]?.join(', ')}</p>
                 </div>
               </div>
               <button 
                 onClick={() => setCurrentIntendant(null)}
                 className="text-xs bg-white/50 hover:bg-white px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
               >
                 {t('switchUser')}
               </button>
            </div>
          )}

          {userRole === 'admin' && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between text-purple-800">
               <div className="flex items-center gap-3">
                 <Globe className="text-purple-600" />
                 <div>
                   <p className="font-bold">{t('globalAdminView')}</p>
                   <p className="text-xs opacity-80">{t('viewingAll')}</p>
                 </div>
               </div>
            </div>
          )}

          {/* Date Picker Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                   <CalendarIcon size={24} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-500 mb-1">{t('inspectionDate')}</label>
                   <div className="flex items-center gap-2">
                     <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <ChevronLeft size={20} />
                     </button>
                     <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="font-bold text-xl text-gray-900 border-none p-0 focus:ring-0 cursor-pointer bg-transparent"
                     />
                     <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                        <ChevronRight size={20} />
                     </button>
                   </div>
                </div>
             </div>
             <button 
               onClick={() => setCurrentView('tracker')}
               className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
             >
               {t('startInspection')}
               <ArrowRight size={20} />
             </button>
          </div>

          {/* Stats & Buildings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-sm text-gray-500 mb-1">{t('pending')}</div>
                <div className="text-3xl font-bold text-blue-600">{stats.progress}</div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-sm text-gray-500 mb-1">{t('clean')}</div>
                <div className="text-3xl font-bold text-emerald-600">{stats.clean}</div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-sm text-gray-500 mb-1">{t('issuesFound')}</div>
                <div className="text-3xl font-bold text-rose-600">{stats.dirty}</div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-sm text-gray-500 mb-1">{t('globalAvg')}</div>
                <div className="flex items-center gap-1 text-3xl font-bold text-amber-500">
                   {stats.avgScore} <Star size={20} className="fill-current" />
                </div>
             </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-gray-500" />
              {t('buildingPerformance')}
            </h3>
            {/* Show allowed buildings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {buildingStats.map((b) => (
                <div key={b.name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                   <div className="flex items-center gap-3">
                     <div className={`p-2.5 rounded-lg ${b.bg} ${b.color}`}>
                       <Building size={20} />
                     </div>
                     <div>
                       <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                       <p className="text-[10px] text-gray-500">{b.count} {t('evaluated')}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                     <span className="text-lg font-bold text-gray-900">{b.avg}</span>
                     <Star size={14} className="fill-amber-400 text-amber-400" />
                   </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const TrackerView = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Tracker Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => {
                setCurrentView('dashboard');
                if (userRole === 'student') {
                  setStudentSelectedRoomId(null);
                  setStudentIdInput('');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors flex items-center gap-2"
              title={t('backToDashboard')}
            >
               <Home size={20} />
               {userRole === 'student' && <span className="text-sm font-medium">{t('exitRoomView')}</span>}
            </button>
            <div>
               <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                 {userRole === 'student' ? t('myRoomStatus') : t('inspection')}
                 <span className="text-base font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                   {formatDate(selectedDate)}
                 </span>
               </h2>
            </div>
         </div>

         {/* Filters */}
         {userRole !== 'student' && (
           <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              <button
                onClick={() => !responsibleBuilding && setSelectedBuilding('All')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedBuilding === 'All' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'} ${responsibleBuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!!responsibleBuilding}
              >
                {t('allBuildings')}
              </button>
              {buildingStats.map(b => (
                <button
                  key={b.name}
                  onClick={() => setSelectedBuilding(b.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedBuilding === b.name ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                >
                  {b.name}
                </button>
              ))}
           </div>
         )}
      </div>

      {/* Search */}
      {userRole !== 'student' && (
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
        </div>
      )}

      {/* Grid */}
      {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map(room => (
              <div 
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${
                  room.status === 'dirty' ? 'border-rose-200' : 'border-gray-200'
                } ${userRole === 'student' ? 'ring-2 ring-indigo-500 shadow-xl scale-105' : ''}`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${STATUS_CONFIG[room.status] ? STATUS_CONFIG[room.status].color.split(' ')[0] : STATUS_CONFIG.progress.color.split(' ')[0]}`}></div>
                
                <div className="flex justify-between items-start mb-2 pl-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{room.number}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{room.building}</p>
                  </div>
                  <StatusBadge status={room.status} t={t} />
                </div>
                
                <div className="pl-3 mb-2 min-h-[1.25rem]">
                   {typeof room.residentName === 'string' && room.residentName ? (
                     <p className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
                       <User size={14} /> {room.residentName}
                     </p>
                   ) : (
                     <p className="text-xs text-gray-400 italic flex items-center gap-1.5">
                       <UserPlus size={14} /> Unassigned
                     </p>
                   )}
                </div>

                <div className="pl-3 space-y-2 border-t border-gray-50 pt-2">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} />
                        <span>{formatDate(room.lastUpdated || selectedDate)}</span>
                     </div>
                     {room.score > 0 && (
                       <div className="flex gap-0.5">
                         <Star size={12} className="fill-amber-400 text-amber-400" />
                         <span className="text-xs font-bold text-amber-600">{room.score}</span>
                       </div>
                     )}
                  </div>
                  
                  {room.issues && room.issues.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.issues.slice(0, 2).map(issue => (
                        <span key={issue} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] rounded border border-rose-100 truncate max-w-[120px]">
                          {t(ISSUE_KEY_MAP[issue]) || issue}
                        </span>
                      ))}
                      {room.issues.length > 2 && (
                         <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded border border-gray-200">
                          +{room.issues.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {room.notes && !room.issues?.length && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 italic border border-gray-100 line-clamp-2">
                      "{room.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
             {t('noRoomsFound')}
             {/* Only show Reset button to Admin or Intendant to avoid accidental resets by lower roles */}
             {(userRole === 'admin' || (userRole === 'intendant' && !currentIntendant)) && !isResetting && (
               <div className="mt-4">
                  <p className="text-sm text-red-500 mb-2 font-medium flex items-center justify-center gap-1">
                    <AlertTriangle size={14} />
                    {t('dataMismatch')}
                  </p>
                  <button 
                    onClick={resetData}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                  >
                    {t('updateBuildingNames')}
                  </button>
               </div>
             )}
          </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Building className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 hidden sm:block">
              {t('appTitle')}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             {/* Language Switcher */}
             <button
               onClick={() => setLanguage(l => l === 'en' ? 'ro' : l === 'ro' ? 'ru' : 'en')}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
               title="Switch Language"
             >
               <Languages size={18} />
               <span className="uppercase">{language}</span>
             </button>

            <div className="flex bg-gray-100 rounded-lg p-1 overflow-hidden">
               {Object.keys(ROLE_LABELS).map(roleKey => {
                 const config = ROLE_LABELS[roleKey];
                 const Icon = config.icon;
                 const isActive = userRole === roleKey;
                 const isProtected = roleKey !== 'student';
                 return (
                   <button
                    key={roleKey}
                    onClick={() => requestRoleChange(roleKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                    title={`Switch to ${t(config.labelKey)} View`}
                   >
                     {isProtected && !isActive && <Lock size={12} className="text-gray-400" />}
                     <Icon size={16} />
                     <span className="hidden md:inline">{t(config.labelKey)}</span>
                   </button>
                 );
               })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Initialization Check */}
        {staticRooms.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center text-gray-500">
             <div className="bg-gray-50 p-6 rounded-full mb-6">
               <LayoutGrid className="w-12 h-12 text-gray-400" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('dbEmpty')}</h3>
             <p className="max-w-md text-gray-600 mb-8">
               {t('dbEmptyMsg')}
             </p>
             <button 
                onClick={seedData}
                disabled={isResetting}
                className="px-8 py-4 bg-indigo-600 text-white text-lg rounded-xl hover:bg-indigo-700 font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center gap-2"
              >
                {isResetting ? <RefreshCw className="animate-spin" /> : <Plus />}
                {t('initializeDb')}
              </button>
          </div>
        ) : (
          /* Main Views */
          currentView === 'dashboard' ? <DashboardView /> : <TrackerView />
        )}
      </main>
      
      {/* Footer / Reset Data */}
      {/* Only show Reset to Intendant/Admin for safety */}
      {(userRole === 'intendant' || userRole === 'admin') && (
        <footer className="max-w-7xl mx-auto px-4 py-6 border-t border-gray-200 mt-8 flex justify-between items-center text-sm text-gray-500">
           <p>© 2024 University Facilities</p>
           <button 
             onClick={resetData} 
             disabled={isResetting}
             className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 disabled:opacity-50"
           >
             <RefreshCw size={14} className={isResetting ? "animate-spin" : ""} />
             {isResetting ? t('resetting') : t('resetRegistry')}
           </button>
        </footer>
      )}

      {/* Evaluation / Update Modal */}
      {selectedRoom && (
        <Modal 
          isOpen={!!selectedRoom} 
          onClose={() => setSelectedRoom(null)} 
          title={`Room ${selectedRoom.number} - ${selectedRoom.building}`}
        >
          {canManage ? (
            <EvaluationForm room={selectedRoom} onClose={() => setSelectedRoom(null)} updateRoomStatus={updateRoomStatus} isIntendant={isIntendant} residentSuggestions={RESIDENTS_DATA[selectedRoom.building]} t={t} />
          ) : (
            // Simple Student View (Request only)
             <div className="space-y-6">
                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${STATUS_CONFIG[selectedRoom.status] ? STATUS_CONFIG[selectedRoom.status].color : STATUS_CONFIG.progress.color}`}>
                     {React.createElement(STATUS_CONFIG[selectedRoom.status] ? STATUS_CONFIG[selectedRoom.status].icon : STATUS_CONFIG.progress.icon, { size: 24 })}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">{t('evaluationStatus')}</p>
                    <p className="font-bold text-gray-900">{t(STATUS_CONFIG[selectedRoom.status] ? STATUS_CONFIG[selectedRoom.status].labelKey : 'statusProgress')}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => updateRoomStatus(selectedRoom.id, 'attention', 'Student requested inspection')}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow-sm transition-all"
                  >
                    <AlertCircle size={20} />
                    {t('requestInspection')}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    {t('studentRequestText')}
                  </p>
                </div>
                 <button 
                  onClick={() => setSelectedRoom(null)}
                  className="w-full py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('close')}
                </button>
             </div>
          )}
        </Modal>
      )}

      {/* Security Auth Modal */}
      {isAuthModalOpen && (
        <Modal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          title={t('securityCheck')}
        >
          <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-xl flex items-center gap-3 border border-indigo-100">
              <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm">
                <Lock size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('restrictedAccess')}</p>
                <p className="text-sm text-gray-600">{t('enterSecurityCode')} {t(ROLE_LABELS[pendingRole]?.labelKey)} mode.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('securityCodeLabel')}</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={authInput}
                  onChange={(e) => {
                    setAuthInput(e.target.value);
                    setAuthError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && confirmRoleChange()}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${authError ? 'border-rose-300 focus:ring-rose-500' : 'border-gray-200 focus:ring-indigo-500'} focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder={t('enterPin')}
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-left-1">
                  <AlertCircle size={12} />
                  {t('incorrectCode')}
                </p>
              )}
              {/* Hint for demo purposes */}
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Demo Hint: Intendant (8888), Responsible (1111)
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="flex-1 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={confirmRoleChange}
                className="flex-1 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                {t('accessDashboard')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}