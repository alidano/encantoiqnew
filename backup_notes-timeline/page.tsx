"use client";

import React, { useEffect, useState } from 'react';
import { fetchAllPatientNotes } from '@/services/patientService';
import type { Note } from '@/types';
import { format, isValid } from 'date-fns';
import { User, Calendar, FileText, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface NoteWithPatient extends Note {
  patient?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  user?: {
    displayName?: string;
    email?: string;
  };
}

const AdminNotesTimelinePage: React.FC = () => {
  const [notes, setNotes] = useState<NoteWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const fetchedNotes = await fetchAllPatientNotes();
        setNotes(fetchedNotes);
      } catch (err) {
        console.error("Error fetching notes:", err);
        setError("Failed to load notes.");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const formatDateTime = (dateString: string) => {
    if (!dateString || !isValid(new Date(dateString))) {
      return 'Invalid Date';
    }
    return format(new Date(dateString), 'MMM do, yyyy h:mm a');
  };

  const getPatientName = (note: NoteWithPatient) => {
    if (note.patient) {
      return `${note.patient.firstname} ${note.patient.lastname}`;
    }
    return 'Unknown Patient';
  };

  const getCreatedBy = (note: NoteWithPatient) => {
    if (note.user?.displayName) {
      return note.user.displayName;
    }
    if (note.user?.email) {
      return note.user.email;
    }
    return 'System/Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <Activity className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Notes Timeline</h1>
          <p className="text-muted-foreground mt-2">
            A comprehensive timeline of all patient notes across the system
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {notes.length} Total Notes
        </Badge>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Patient Notes Timeline</span>
          </CardTitle>
          <CardDescription>
            View and manage all patient notes created by staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No notes found</p>
              <p className="text-muted-foreground text-sm">Patient notes will appear here when they are created</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Date/Time</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px]">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Patient Name</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px]">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Created By</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Note Content</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDateTime(note.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getPatientName(note)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getCreatedBy(note) === 'System/Unknown' ? 'secondary' : 'default'}
                          className="font-normal"
                        >
                          {getCreatedBy(note)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm leading-relaxed line-clamp-3">
                            {note.note_content || 'No content'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotesTimelinePage;