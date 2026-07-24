import goku from '@/app/components/projects/assets/houseteam.png'
import Mehdi from '@/app/components/projects/assets/people.png'
import azVoyage from '@/app/components/projects/assets/az-voyage.webp'
import dragonBall from '@/app/components/projects/assets/dragon-ball.webp'
import livora from '@/app/components/projects/assets/livora.webp'
import starride from '@/app/components/projects/assets/starride.webp'
import svelte3d from '@/app/components/projects/assets/svelte-3d.webp'
import { StaticImageData } from 'next/image'

export type Projects = {
  id: number | string
  title: string
  description: string
  live_url: string
  github?: string
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
  {
    id: 3,
    title: 'Star Ride',
    description:
      'A premium car rental experience in Algeria with fleet discovery, booking, and flexible pick-up and return options.',
    live_url: 'https://www.starridedz.com',
    thumbnail: starride,
  },
  {
    id: 4,
    title: 'AZ Voyage',
    description:
      'A travel agency platform for curated stays, Umrah, organized trips, and tailor-made journeys from Algeria.',
    live_url: 'https://www.azvoyage.net',
    github: 'https://github.com/Mehdidjah/AZ-agency',
    thumbnail: azVoyage,
  },
  {
    id: 5,
    title: 'Svelte 3D',
    description:
      'An experimental SvelteKit experience exploring smooth scrolling, expressive motion, and immersive Three.js visuals.',
    live_url: 'https://svelte-3d-website.vercel.app',
    github: 'https://github.com/Mehdidjah/Svelte-3d-website',
    thumbnail: svelte3d,
  },
  {
    id: 6,
    title: 'Dragon Ball Z',
    description:
      'An animated fan experience that brings Dragon Ball Z heroes, iconic battles, and the series timeline to the web.',
    live_url: 'https://dragonball-super.vercel.app',
    github: 'https://github.com/Mehdidjah/Dragon-ball-website',
    thumbnail: dragonBall,
  },
  {
    id: 7,
    title: 'Livora Furniture',
    description:
      'A refined furniture storefront for discovering curated home pieces, minimalist collections, and custom creations.',
    live_url: 'https://livora-furniture.vercel.app',
    thumbnail: livora,
  },
]
