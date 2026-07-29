'use client'

import {
    Activity, AlertCircle, AlertTriangle, ArrowLeft,
    Bell, Building2, Check, CheckCheck, CheckCircle,
    ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
    ClipboardList, Clock, Copy, Download, Eye, EyeOff,
    File, FileText, Funnel, Home, ImageIcon, ImageOff,
    KeyRound, LayoutDashboard, Link2, Loader2, LogIn, LogOut, Mail,
    Menu, Monitor, Moon, Paperclip, Pencil, Plus, Receipt, RefreshCw, Search,
    Settings, ShelvingUnit, Shield, Sun, ToggleLeft, ToggleRight,
    Trash2, Upload, UserCog, UserPlus, Users,
    Table2, Vibrate, Wallet, X, XCircle,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const ICONS = {
    activity:           Activity,
    'alert-circle':     AlertCircle,
    'alert-triangle':   AlertTriangle,
    'arrow-left':       ArrowLeft,
    bell:               Bell,
    building2:          Building2,
    check:              Check,
    'check-check':      CheckCheck,
    'check-circle':     CheckCircle,
    'chevron-down':     ChevronDown,
    'chevron-left':     ChevronLeft,
    'chevron-right':    ChevronRight,
    'chevron-up':       ChevronUp,
    'clipboard-list':   ClipboardList,
    clock:              Clock,
    copy:               Copy,
    download:           Download,
    eye:                Eye,
    'eye-off':          EyeOff,
    file:               File,
    'file-text':        FileText,
    funnel:             Funnel,
    home:               Home,
    image:              ImageIcon,
    'image-off':        ImageOff,
    'key-round':        KeyRound,
    'layout-dashboard': LayoutDashboard,
    link2:              Link2,
    loader2:            Loader2,
    'log-in':           LogIn,
    'log-out':          LogOut,
    mail:               Mail,
    menu:               Menu,
    monitor:            Monitor,
    moon:               Moon,
    paperclip:          Paperclip,
    pencil:             Pencil,
    plus:               Plus,
    receipt:            Receipt,
    'refresh-cw':       RefreshCw,
    search:             Search,
    settings:           Settings,
    'shelving-unit':    ShelvingUnit,
    shield:             Shield,
    sun:                Sun,
    'toggle-left':      ToggleLeft,
    'toggle-right':     ToggleRight,
    trash2:             Trash2,
    upload:             Upload,
    'user-cog':         UserCog,
    'user-plus':        UserPlus,
    users:              Users,
    'table-2':          Table2,
    vibrate:            Vibrate,
    wallet:             Wallet,
    x:                  X,
    'x-circle':         XCircle,
} as const

export type IconName = keyof typeof ICONS

interface Props extends LucideProps {
    name: IconName
}

export default function Icon({ name, ...props }: Props) {
    const Component = ICONS[name]
    return <Component {...props} />
}
