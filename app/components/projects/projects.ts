import goku from '@/app/components/projects/assets/houseteam.png'
import Mehdi from '@/app/components/projects/assets/people.png'
import { StaticImageData } from 'next/image'

export type Projects = {
  id: number | string
  title: string
  description: string
  live_url: string
  github: string
  thumbnail: StaticImageData
}

export const projects: Projects[] = [
  {
    id: 1,
    title: 'Thinkercare-website',
    description:
      'ThinkerCare Group is a creative & production collective that transforms bold ideas into real-world brands, products and experiences.',
    live_url: 'https://www.thinkercaregroup.com',
    github: 'https://github.com/Mehdidjah/THINKERCARE-WEBSITE',
    thumbnail: Mehdi,
  },
  {
    id: 2,
    title: 'Houseteam',
    description: 'vibe coded website for my friend ideathon',
    live_url: 'https://vibecoded-ideathonweb.vercel.app',
    github: 'https://github.com/Mehdidjah/vibecoded-ideathonweb',
    thumbnail: goku,
  },
]
