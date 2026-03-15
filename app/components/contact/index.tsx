import {
  IconBrandGithub,
  IconBrandGmail,
  IconBrandLeetcode,
  IconBrandLinkedin,
} from '@tabler/icons-react'
import Image from 'next/image'
import Link from 'next/link'

export function Contact() {
  return (
    <div className="max-h-full overflow-y-auto overflow-x-hidden">
      <div className="relative h-32 sm:h-36">
        <Image
          fill
          className="object-cover object-center"
          alt=""
          src="/assets/images/goku.webp"
        />
        <div className="absolute left-2 sm:left-5 top-10 sm:top-14">
          <Image
            alt=""
            width={80}
            height={80}
            src="/assets/images/author.webp"
            className="rounded-full w-20 h-20 sm:w-[120px] sm:h-[120px]"
          />
        </div>
        <h1 className="absolute bottom-2 sm:bottom-5 left-24 sm:left-40 text-xl sm:text-4xl font-medium text-dark-text truncate max-w-[calc(100%-6rem)] sm:max-w-none">
          Mehdi Djahraoui
        </h1>
      </div>
      <div className="mt-12 sm:mt-20 flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-4 font-medium">
        <Link
          href="https://www.linkedin.com/in/mehdi-djahraoui-134bb6389/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-2 rounded-sm bg-black/5 px-3 py-1 text-sky-500 dark:bg-white/10"
        >
          <IconBrandLinkedin />
          <span>Linkedin</span>
        </Link>
        <Link
          href="https://github.com/Mehdidjah?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-2 rounded-sm bg-black/5 px-3 py-1 dark:bg-white/10"
        >
          <IconBrandGithub />
          <span>Github</span>
        </Link>
        <Link
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-2 rounded-sm bg-black/5 px-3 py-1 text-[#FFA116] dark:bg-white/10"
        >
          <IconBrandLeetcode />
          <span>LeetCode</span>
        </Link>
        <Link
          href="mailto:phoenixytbdjah7@gmail.com?subject=Hello%20Mehdi&body=Hi%20Mehdi,"
          className="flex gap-2 rounded-sm bg-black/5 px-3 py-1 text-[#EB493B] dark:bg-white/10"
        >
          <IconBrandGmail />
          <span>E-mail</span>
        </Link>
      </div>
      <div className="p-4 text-justify text-sm sm:text-lg overflow-x-hidden">
        <h2 className="mb-4 text-lg sm:text-xl font-medium">About Me</h2>
        <div className="float-none sm:float-right sm:ml-8 mb-4 sm:mb-0 text-center sm:text-right">
          <Image
            alt=""
            src="/assets/images/author2.webp"
            width={200}
            height={100}
            className="rounded-sm w-full max-w-[200px] mx-auto sm:mx-0"
          />
        </div>
        <p className="mb-4">
          Hey there! I&apos;m Mehdi, a skilled front-end developer from Algeria who
          genuinely loves building beautiful and interactive web experiences. I
          have a strong passion for coding, problem-solving, and creating smooth,
          high-performance interfaces. I enjoy mastering modern web technologies
          like React and Next.js and bringing projects to life with motion design,
          adding that little extra spark to make them engaging. Currently, I&apos;m
          collaborating with Thinkercare Group, where I get to combine my
          creativity and technical skills every day.
        </p>
        <p>
          Beyond coding, I enjoy exploring new ideas and challenges. I love
          traveling, trying out different foods, going swimming, hiking in nature,
          and occasionally diving into a good book. Life&apos;s too short to stay in
          one place, both in code and in experiences.
        </p>
      </div>
    </div>
  )
}
