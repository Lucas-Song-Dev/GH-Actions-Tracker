import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RepositorySelectorProps {
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
}

interface RepositoryListResponse {
  repositories: string[];
  default: string;
}

export default function RepositorySelector({
  selectedRepo,
  onRepoChange,
}: RepositorySelectorProps) {
  const { data: repoData, isLoading } = useQuery<RepositoryListResponse>({
    queryKey: ["/api/repositories"],
  });

  const [repoName, setRepoName] = useState<string>("");
  const [repoOwner, setRepoOwner] = useState<string>("");

  // Parse the selected repo into owner and name components
  useEffect(() => {
    if (selectedRepo) {
      const [owner, name] = selectedRepo.split("/");
      setRepoOwner(owner);
      setRepoName(name);
    }
  }, [selectedRepo]);

  // Handle repo change
  const handleRepoChange = (value: string) => {
    onRepoChange(value);
  };

  // Determine repo type
  const getRepoType = (repoName: string) => {
    if (repoName.includes("Personal-Website")) {
      return "Website";
    } else if (repoName.includes("RedditPainpoint")) {
      return "Python Flask React Vite";
    } else {
      return "Repository";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="py-4 px-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Repository</CardTitle>
          {repoName && (
            <Badge variant="outline" className="bg-github-lightgray">
              {getRepoType(repoName)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            {repoOwner && repoName && (
              <div>
                <div className="text-xs text-github-neutral mb-1">
                  Owner / Project
                </div>
                <div className="font-medium">
                  <span className="text-github-neutral">{repoOwner} / </span>
                  <span className="text-github-blue">{repoName}</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-64">
            <Select
              disabled={isLoading}
              value={selectedRepo}
              onValueChange={handleRepoChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select repository" />
              </SelectTrigger>
              <SelectContent>
                {repoData?.repositories.map((repo) => (
                  <SelectItem key={repo} value={repo}>
                    {repo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 text-xs text-github-neutral">
          <span>
            <i className="fas fa-info-circle mr-1"></i>
            View and manage GitHub Actions workflows for this repository
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
