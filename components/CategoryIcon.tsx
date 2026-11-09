'use client'

import React from 'react'
import {
  Smartphone,
  Shirt,
  Briefcase,
  BookOpen,
  Watch,
  Key,
  FileText,
  Activity,
  Package,
} from 'lucide-react'

interface CategoryIconProps {
  category?: string | null
  className?: string
}

export function CategoryIcon({ category, className = 'w-4 h-4' }: CategoryIconProps) {
  const c = (category || '').toLowerCase()

  if (c.includes('elect') || c.includes('phone') || c.includes('laptop') || c.includes('charger') || c.includes('airpod')) {
    return <Smartphone className={className} />
  }
  if (c.includes('cloth') || c.includes('wear') || c.includes('shirt') || c.includes('jacket')) {
    return <Shirt className={className} />
  }
  if (c.includes('bag') || c.includes('wallet') || c.includes('purse') || c.includes('backpack')) {
    return <Briefcase className={className} />
  }
  if (c.includes('book') || c.includes('note') || c.includes('calculator') || c.includes('study')) {
    return <BookOpen className={className} />
  }
  if (c.includes('access') || c.includes('watch') || c.includes('ring') || c.includes('glass')) {
    return <Watch className={className} />
  }
  if (c.includes('key') || c.includes('card') || c.includes('id')) {
    return <Key className={className} />
  }
  if (c.includes('doc') || c.includes('file') || c.includes('paper')) {
    return <FileText className={className} />
  }
  if (c.includes('sport') || c.includes('gym') || c.includes('ball') || c.includes('fitness')) {
    return <Activity className={className} />
  }

  return <Package className={className} />
}

