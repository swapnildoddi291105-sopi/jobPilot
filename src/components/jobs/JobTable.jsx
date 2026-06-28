import { useState } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { useDeleteJob } from "@/hooks/useJobs"
import { ChevronLeft, ChevronRight, MoreHorizontal, Eye, Trash2, ExternalLink } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const statusVariantMap = {
  Applied: "info",
  Interviewing: "warning",
  Offer: "success",
  Rejected: "destructive",
  Saved: "secondary",
  "Phone Screen": "default",
}

const PAGE_SIZE = 8

export function JobTable({ jobs, isLoading, onSelectJob }) {
  const [page, setPage] = useState(1)
  const deleteJob = useDeleteJob()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  const totalPages = Math.ceil(jobs.length / PAGE_SIZE)
  const paginated = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Job Title</TableHead>
              <TableHead className="hidden sm:table-cell">Company</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Date Applied</TableHead>
              <TableHead className="hidden xl:table-cell">Salary</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No jobs found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onSelectJob(job)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{job.company}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {job.company.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm">{job.company}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{job.source}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[job.status] || "secondary"} className="text-[10px]">
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">{formatDate(job.dateApplied)}</span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-sm text-muted-foreground">{job.salary}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelectJob(job) }}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); if (job.url) window.open(job.url, "_blank") }}>
                          <ExternalLink className="mr-2 h-4 w-4" /> Open Job
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Remove this job?")) deleteJob.mutate(job.id) }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, jobs.length)} of {jobs.length} jobs
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
