'use client'

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, RefreshCw, Loader2 } from "lucide-react";

interface FileItem {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

const ImageGrid = ({ 
  files, 
  onDelete,
  isDeleting
}: { 
  files: FileItem[]; 
  onDelete: (name: string) => void;
  isDeleting: boolean;
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <div
          key={file.name}
          className="group relative border rounded-lg p-2 hover:border-blue-500 transition-colors"
        >
          <div className="aspect-square relative rounded-md overflow-hidden">
            <img
              src={file.url}
              alt={file.name}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(file.name)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const UploadBox = ({ 
  onUpload,
  isUploading 
}: { 
  onUpload: (file: File) => void;
  isUploading: boolean;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }, [onUpload]);

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="mt-2 text-sm text-gray-500">Uploading...</p>
        </div>
      ) : (
        <>
          <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Drag and drop your images here</p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <label>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
            <Button>
              Browse Files
            </Button>
          </label>
        </>
      )}
    </div>
  );
};

export default function R2FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/r2/list');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setFiles(data.files);
      setError(null);
    } catch (err) {
      setError('Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/r2/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await fetchFiles();
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [fetchFiles]);

  const handleDelete = useCallback(async (fileName: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/r2/delete?file=${fileName}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await fetchFiles();
    } catch (err) {
      setError('Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  }, [fetchFiles]);

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>R2 File Manager</span>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchFiles}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="images">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                No images uploaded yet
              </p>
            ) : (
              <ImageGrid
                files={files}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            )}
          </TabsContent>
          
          <TabsContent value="upload">
            <UploadBox
              onUpload={handleUpload}
              isUploading={isUploading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
