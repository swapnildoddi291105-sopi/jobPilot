import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { FileText, Download, Eye, Clock, Target } from "lucide-react"

export function ResumeCard({ resume, onView }) {
  const score = resume.atsScore
  const atsColor = score >= 90 ? "success" : score >= 80 ? "warning" : "destructive"

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer" onClick={() => onView(resume)}>
      <CardContent className="p-0">
        {/* Resume thumbnail / preview */}
        <div className="relative h-40 bg-gradient-to-br from-primary/5 to-primary/10 rounded-t-xl flex items-center justify-center overflow-hidden">
          <FileText className="h-12 w-12 text-primary/40" />
          {score != null && (
            <div className="absolute top-3 right-3">
              <Badge variant={atsColor} className="text-xs">
                ATS {score}%
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.stopPropagation() }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.stopPropagation() }}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <div>
            <h3 className="text-sm font-semibold truncate">{resume.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{resume.fileName}</p>
          </div>

          {resume.targetRole && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span className="truncate">{resume.targetRole}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(resume.dateUploaded)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{resume.size}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
