'use client'

import {
    Activity, AlertCircle, AlertTriangle, ArrowLeft,
    Bell, Building2, Check, CheckCheck, CheckCircle,
    ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
    Clock, Copy, Download, Eye, EyeOff,
    File, FileText, Funnel, ImageIcon, ImageOff,
    Link2, Loader2, LogIn, LogOut, Mail,
    Menu, Paperclip, Pencil, Plus,
    RefreshCw, Search, Trash2, Upload,
    UserPlus, Users, Wallet, X, XCircle,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const ICONS = {
    activity:         Activity,
    'alert-circle':   AlertCircle,
    'alert-triangle': AlertTriangle,
    'arrow-left':     ArrowLeft,
    bell:             Bell,
    building2:        Building2,
    check:            Check,
    'check-check':    CheckCheck,
    'check-circle':   CheckCircle,
    'chevron-down':   ChevronDown,
    'chevron-left':   ChevronLeft,
    'chevron-right':  ChevronRight,
    'chevron-up':     ChevronUp,
    clock:            Clock,
    copy:             Copy,
    download:         Download,
    eye:              Eye,
    'eye-off':        EyeOff,
    file:             File,
    'file-text':      FileText,
    funnel:           Funnel,
    image:            ImageIcon,
    'image-off':      ImageOff,
    link2:            Link2,
    loader2:          Loader2,
    'log-in':         LogIn,
    'log-out':        LogOut,
    mail:             Mail,
    menu:             Menu,
    paperclip:        Paperclip,
    pencil:           Pencil,
    plus:             Plus,
    'refresh-cw':     RefreshCw,
    search:           Search,
    trash2:           Trash2,
    upload:           Upload,
    'user-plus':      UserPlus,
    users:            Users,
    wallet:           Wallet,
    x:                X,
    'x-circle':       XCircle,
} as const

export type IconName = keyof typeof ICONS

interface Props extends LucideProps {
    name: IconName
}

export default function Icon({ name, ...props }: Props) {
    const Component = ICONS[name]
    return <Component {...props} />
}
