import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, useCreateProject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderKanban, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const queryClient = useQueryClient();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate({ data: { title, description } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        setOpen(false);
        setTitle("");
        setDescription("");
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Organize your protected files into collections.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} className="bg-background border-white/10" placeholder="e.g. Q4 Marketing Assets" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-background border-white/10" placeholder="Optional context..." />
              </div>
              <Button type="submit" className="w-full" disabled={createProject.isPending}>
                {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !projects || projects.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 border-white/5">
          <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-muted-foreground text-sm">Create your first project to start organizing.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="h-full bg-card/50 hover:bg-card border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <CardTitle className="group-hover:text-primary transition-colors">{project.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {project.description || "No description provided."}
                  </p>
                  <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                    {project.fileCount} {project.fileCount === 1 ? 'file' : 'files'}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
