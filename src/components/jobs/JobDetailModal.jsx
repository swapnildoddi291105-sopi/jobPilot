import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { useUpdateJob } from "@/hooks/useJobs"
import { MapPin, DollarSign, Globe, ExternalLink, Clock, FileText, StickyNote } from "lucide-react"

const STATUS_OPTIONS = ["Saved", "Applied", "Phone Screen", "Interviewing", "Offer", "Rejected"]

const statusVariantMap = {
  Applied: "info",
  Interviewing: "warning",
  Offer: "success",
  Rejected: "destructive",
  Saved: "secondary",
  "Phone Screen": "default",
}

export function JobDetailModal({ job, open, onClose }) {
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const updateJob = useUpdateJob()

  if (!job) return null

  async function handleUpdateStatus() {
    if (!newStatus) return
    setUpdating(true)
    try {
      await updateJob.mutateAsync({ id: job.id, status: newStatus })
      setNewStatus("")
      onClose()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3 pr-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{job.title}</SheetTitle>
              <SheetDescription className="text-base mt-1">{job.company}</SheetDescription>
            </div>
            <Badge variant={statusVariantMap[job.status] || "secondary"} className="text-xs">
              {job.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Key details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{job.salary}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>{job.source}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Applied {formatDate(job.dateApplied)}</span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
              <FileText className="h-4 w-4" />
              Job Description
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
              <StickyNote className="h-4 w-4" />
              Notes
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{job.notes}</p>
          </div>

          <Separator />

          {/* Timeline */}
          {job.timeline && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Clock className="h-4 w-4" />
                Timeline
              </h4>
              <div className="space-y-3">
                {job.timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                      {idx < job.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <div className="flex flex-1 gap-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="New status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleUpdateStatus} disabled={!newStatus || updating}>
                {updating ? "..." : "Update"}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => job.url && window.open(job.url, "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" />
              View Job
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
