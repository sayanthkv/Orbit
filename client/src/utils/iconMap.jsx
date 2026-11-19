import React from 'react';
import {
  Utensils,
  Plane,
  Home,
  Receipt,
  ShoppingBag,
  HeartPulse,
  Tv,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  Car,
  Coffee,
  Gift,
  Book,
  Dumbbell,
  MoreHorizontal,
  Tag,
} from 'lucide-react';

const ICON_COMPONENTS = {
  Utensils,
  Plane,
  Home,
  Receipt,
  ShoppingBag,
  HeartPulse,
  Tv,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  Car,
  Coffee,
  Gift,
  Book,
  Dumbbell,
  MoreHorizontal,
  Tag,
};

export const getCategoryIcon = (iconName, className = 'w-5 h-5') => {
  const IconComponent = ICON_COMPONENTS[iconName] || Tag;
  return <IconComponent className={className} />;
};

export const AVAILABLE_ICONS = Object.keys(ICON_COMPONENTS);
