import { ProjectCard } from './project-card'
import { projects } from './projects'

export function Projects() {
  return (
    <div className="flex max-h-full flex-wrap gap-4 overflow-y-auto overflow-x-hidden p-2 sm:p-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
