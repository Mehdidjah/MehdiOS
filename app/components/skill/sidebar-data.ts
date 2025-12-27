import {
  Icon,
  IconBrandDjango,
  IconBrandVue,
  IconCode,
  IconProps,
  IconTool,
} from '@tabler/icons-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

interface SidebarData {
  id: string
  label: string
  Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
}

export const sidebarData: SidebarData[] = [
  {
    id: 'languages',
    label: 'Languages',
    Icon: IconCode,
  },
  {
    id: 'frontend',
    label: 'Frontend',
    Icon: IconBrandVue,
  },
  {
    id: 'backend',
    label: 'Backend',
    Icon: IconBrandDjango,
  },
  {
    id: 'tools',
    label: 'Tools',
    Icon: IconTool,
  },
]
