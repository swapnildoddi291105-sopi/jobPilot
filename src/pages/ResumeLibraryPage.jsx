import { useState } from "react"
import { useResumes } from "@/hooks/useResumes"
import { ResumeCard } from "@/components/resume/ResumeCard"
import { ResumeViewer } from "@/components/resume/ResumeViewer"
import { ResumeUploader } from "@/components/resume/ResumeUploader"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, FileText, Download } from "lucide-react"

export default function ResumeLibraryPage() {
  const [sortBy, setSortBy] = useState("date")
  const [order, setOrder] = useState("desc")
  const [selectedResume, setSelectedResume] = useState(null)
  const { data: resumes, isLoading } = useResumes({ sortBy, order })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Your Resumes</h2>
          <p className="text-sm text-muted-foreground">
            {resumes?.length || 0} resumes · Upload and manage your resume versions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="ats">ATS Score</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={setOrder}>
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload zone */}
      <ResumeUploader />

      {/* Resume Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes?.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} onView={setSelectedResume} />
          ))}
        </div>
      )}

      {/* Resume Viewer */}
      <ResumeViewer
        resume={selectedResume}
        open={!!selectedResume}
        onClose={() => setSelectedResume(null)}
      />
    </div>
  )
}
