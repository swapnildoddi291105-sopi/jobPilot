import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { Download, Share2, FileText, Target, Clock, HardDrive, CheckCircle2 } from "lucide-react"

export function ResumeViewer({ resume, open, onClose }) {
  if (!resume) return null

  const score = resume.atsScore
  const atsColor = score >= 90 ? "success" : score >= 80 ? "warning" : "destructive"

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-3 pr-6">
          <SheetTitle className="text-xl">{resume.name}</SheetTitle>
          <div className="flex items-center gap-3">
            {score != null ? (
              <Badge variant={atsColor}>ATS Score: {score}%</Badge>
            ) : (
              <Badge variant="secondary">Not scored yet</Badge>
            )}
            <span className="text-sm text-muted-foreground">{resume.size}</span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Target Role</p>
                <p className="font-medium">{resume.targetRole || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Uploaded</p>
                <p className="font-medium">{formatDate(resume.dateUploaded)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">File</p>
                {resume.fileUrl ? (
                  <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                    {resume.fileName}
                  </a>
                ) : (
                  <p className="font-medium">{resume.fileName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Last Updated</p>
                <p className="font-medium">{resume.dateUpdated ? formatDate(resume.dateUpdated) : "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* ATS Score Breakdown */}
          {score != null && (
          <div>
            <h4 className="text-sm font-semibold mb-3">ATS Compatibility</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Overall Score</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      score >= 90 ? "bg-emerald-500" : score >= 80 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {["Keywords Match", "Format", "Experience", "Education"].map((section, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{section}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          <Separator />

          {/* Resume Preview */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Preview</h4>
            {resume.fileUrl && resume.mimeType === "application/pdf" ? (
              <div className="border rounded-lg overflow-hidden h-[500px]">
                <iframe
                  src={resume.fileUrl}
                  className="w-full h-full"
                  title="Resume preview"
                />
              </div>
            ) : resume.fileUrl ? (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-muted/30">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" />
                    Open file
                  </a>
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-muted/30">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">File not available</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" size="sm" asChild>
              <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
