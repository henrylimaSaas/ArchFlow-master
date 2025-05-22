import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Store, Factory } from "lucide-react";
import { Link } from "wouter";
import type { Project } from "@shared/schema";

interface RecentProjectsProps {
  projects: Project[];
  isLoading: boolean;
}

const getProjectIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "residential":
      return Building;
    case "commercial":
      return Store;
    case "industrial":
      return Factory;
    default:
      return Building;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "planning":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-green-100 text-green-800";
    case "delivered":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "planning":
      return "Planejamento";
    case "in_progress":
      return "Em Andamento";
    case "delivered":
      return "Entregue";
    default:
      return status;
  }
};

export default function RecentProjects({ projects, isLoading }: RecentProjectsProps) {
  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Projetos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Projetos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum projeto encontrado</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {projects.map((project) => {
                const IconComponent = getProjectIcon(project.description || "");
                
                return (
                  <li key={project.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          Cliente ID: {project.clientId}
                        </p>
                      </div>
                      <div>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        <div className="mt-6">
          <Link href="/projects">
            <Button variant="outline" className="w-full">
              Ver todos os projetos
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
