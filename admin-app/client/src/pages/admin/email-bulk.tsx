import { useState, useRef, useMemo } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Send, FileText, Users, AlertCircle, CheckCircle2, X, Eye, Search, Mail, Save, UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface EmailTemplate {
  _id: string;
  slug: string;
  name: string;
  subject?: string;
  htmlContent?: string;
  body?: string;
  placeholders: string[];
}

interface CsvRow {
  email: string;
  [key: string]: string;
}

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
}

export default function AdminEmailBulk() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emailMode, setEmailMode] = useState<"template" | "custom">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [sendingProgress, setSendingProgress] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  
  const [userSearch, setUserSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const [customSubject, setCustomSubject] = useState("");
  const [customHtml, setCustomHtml] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSlug, setTemplateSlug] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(false);
  const [allUsersProgress, setAllUsersProgress] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<any>({
    queryKey: ['/api/templates'],
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<any>({
    queryKey: ['/users', { title: searchQuery }],
    enabled: searchQuery.length >= 1,
  });

  const templates: EmailTemplate[] = templatesData?.data || templatesData || [];
  const selectedTemplateData = templates.find(t => t._id === selectedTemplate);
  const searchResults: User[] = usersData?.data || [];

  const autoPopulatedPlaceholders = ['app_name', 'support_email', 'primary_color', 'secondary_color', 'firstname', 'lastname', 'username', 'email', 'name', 'recipient_name', 'version', 'android_version', 'ios_version', 'android_link', 'ios_link'];

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  }), []);

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  const handleSearch = () => {
    if (userSearch.length >= 1) {
      setSearchQuery(userSearch);
    }
  };

  const toggleUserSelection = (user: User) => {
    const isSelected = selectedUsers.some(u => u._id === user._id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const clearSelectedUsers = () => {
    setSelectedUsers([]);
  };

  const loadAllUsers = async () => {
    setIsLoadingAllUsers(true);
    setAllUsersProgress("Loading users...");
    
    try {
      const allUsers: User[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        setAllUsersProgress(`Loading page ${page}...`);
        
        const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        // API returns { data: { users: [...], totalDoc, limits, pages } }
        const responseData = data.data || data;
        const users = responseData.users || responseData.data || responseData || [];
        const totalDoc = responseData.totalDoc || 0;
        
        if (!Array.isArray(users) || users.length === 0) {
          hasMore = false;
        } else {
          allUsers.push(...users);
          
          // Check if we've loaded all users based on totalDoc
          if (allUsers.length >= totalDoc || users.length < limit) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        setAllUsersProgress(`Loaded ${allUsers.length} users...`);
      }

      // Add all users that aren't already selected
      const newUsers = allUsers.filter(
        u => u.email && !selectedUsers.some(s => s._id === u._id)
      );
      
      setSelectedUsers([...selectedUsers, ...newUsers]);
      
      toast({
        title: "Users loaded",
        description: `Added ${newUsers.length} users (${allUsers.length} total found)`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error.message || "Error fetching users",
        variant: "destructive",
      });
    }
    
    setIsLoadingAllUsers(false);
    setAllUsersProgress("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsv(text);
    };
    
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      toast({
        title: "Invalid CSV",
        description: "CSV must have a header row and at least one data row",
        variant: "destructive",
      });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    if (!headers.includes('email')) {
      toast({
        title: "Missing email column",
        description: "CSV must have an 'email' column",
        variant: "destructive",
      });
      return;
    }

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: CsvRow = { email: '' };
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
        });
        if (row.email && isValidEmail(row.email)) {
          rows.push(row);
        }
      }
    }

    setCsvHeaders(headers);
    setCsvData(rows);
    
    toast({
      title: "CSV loaded",
      description: `Found ${rows.length} valid email addresses`,
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const clearCsv = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setFileName("");
    setSendResults({ success: 0, failed: 0, errors: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const replacePlaceholders = (template: string, data: CsvRow): string => {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  };

  const getAllRecipients = (): CsvRow[] => {
    const recipients: CsvRow[] = [...csvData];
    
    for (const user of selectedUsers) {
      if (!recipients.some(r => r.email === user.email)) {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const displayName = user.userName || 'there';
        recipients.push({
          email: user.email,
          firstname: firstName,
          lastname: lastName,
          username: user.userName || '',
          name: displayName,
          recipient_name: displayName,
        });
      }
    }
    
    return recipients;
  };

  const getEmailContent = () => {
    if (emailMode === "template" && selectedTemplateData) {
      const html = selectedTemplateData.htmlContent || selectedTemplateData.body || '';
      const subject = selectedTemplateData.subject || selectedTemplateData.name || 'Notification';
      return { subject, html };
    } else if (emailMode === "custom") {
      return {
        subject: customSubject,
        html: customHtml,
      };
    }
    return null;
  };

  const handlePreview = () => {
    const emailContent = getEmailContent();
    if (!emailContent) return;
    
    const allRecipients = getAllRecipients();
    if (allRecipients.length === 0) {
      setPreviewHtml(emailContent.html);
      setPreviewOpen(true);
      return;
    }
    
    const sampleRow = allRecipients[0];
    const html = replacePlaceholders(emailContent.html, sampleRow);
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const sendBulkEmails = async () => {
    const emailContent = getEmailContent();
    if (!emailContent) return;
    
    const allRecipients = getAllRecipients();
    if (allRecipients.length === 0) return;

    setIsSending(true);
    setSendingProgress(0);
    setSendResults({ success: 0, failed: 0, errors: [] });

    try {
      const response = await apiRequest('POST', '/api/admin/email/send-bulk', {
        recipients: allRecipients,
        subject: emailContent.subject,
        html: emailContent.html,
        fromEmail: fromEmail || undefined,
        useWrapper: emailMode === "custom",
      });

      const result = await response.json();
      
      setSendingProgress(100);
      setSendResults({ 
        success: result.sent || 0, 
        failed: result.failed || 0, 
        errors: result.errors || [] 
      });

      toast({
        title: "Bulk send complete",
        description: `Sent: ${result.sent || 0}, Failed: ${result.failed || 0}`,
        variant: result.failed > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      setSendResults({ success: 0, failed: allRecipients.length, errors: [error.message || 'Failed to send'] });
      toast({
        title: "Bulk send failed",
        description: error.message || "Failed to send emails",
        variant: "destructive",
      });
    }

    setIsSending(false);
  };

  const missingPlaceholders = selectedTemplateData?.placeholders.filter(
    p => !csvHeaders.includes(p) && !autoPopulatedPlaceholders.includes(p)
  ) || [];

  const totalRecipients = getAllRecipients().length;
  
  const canSend = () => {
    if (totalRecipients === 0) return false;
    if (emailMode === "template") {
      return !!selectedTemplate && (missingPlaceholders.length === 0 || csvData.length === 0);
    } else {
      return customSubject.trim() !== '' && customHtml.trim() !== '';
    }
  };

  const canPreview = () => {
    if (emailMode === "template") {
      return !!selectedTemplate;
    } else {
      return customHtml.trim() !== '';
    }
  };

  const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  };

  // Wrap custom HTML content in full email template structure
  const wrapInEmailTemplate = (content: string, subject: string): string => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; text-align: center;">${subject}</h2>
              <div style="color: #52525b; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Questions? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}}; text-decoration: none;">{{support_email}}</a></p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} {{app_name}}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim() || !templateSlug.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both template name and slug",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      // Wrap the custom HTML in full email template structure
      const fullHtml = wrapInEmailTemplate(customHtml, customSubject);
      const placeholders = extractPlaceholders(fullHtml);
      
      const response = await apiRequest('POST', '/api/templates', {
        name: templateName,
        slug: templateSlug,
        htmlContent: fullHtml,
        placeholders,
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      toast({
        title: "Template saved",
        description: `"${templateName}" has been saved successfully`,
      });
      
      setSaveTemplateOpen(false);
      setTemplateName("");
      setTemplateSlug("");
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    }
    setIsSavingTemplate(false);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    setIsDeletingTemplate(true);
    try {
      const response = await apiRequest('DELETE', `/api/templates/${selectedTemplate}`);
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully",
      });
      
      setSelectedTemplate("");
      setDeleteConfirmOpen(false);
      refetchTemplates();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
    setIsDeletingTemplate(false);
  };

  return (
    <AdminLayout title="Bulk Emails" description="Search users or upload CSV to send bulk emails">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Content
            </CardTitle>
            <CardDescription>
              Choose a template or create a custom email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <Label htmlFor="from-email">From Email (optional - uses default from settings if empty)</Label>
              <Input
                id="from-email"
                type="email"
                placeholder="Leave empty to use default from settings"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                data-testid="input-from-email"
              />
            </div>

            <Tabs value={emailMode} onValueChange={(v) => setEmailMode(v as "template" | "custom")}>
              <TabsList className="mb-4">
                <TabsTrigger value="template" data-testid="tab-template">Use Template</TabsTrigger>
                <TabsTrigger value="custom" data-testid="tab-custom">Create Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger data-testid="select-template" className="flex-1">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name} ({template.slug})
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteConfirmOpen(true)}
                    data-testid="button-delete-template"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
                </div>

                {selectedTemplateData && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Placeholders (auto-populated from settings and user data):</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplateData.placeholders.map((p) => (
                        <Badge key={p} variant="outline" size="sm">
                          {`{{${p}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-subject">Subject</Label>
                  <Input
                    id="custom-subject"
                    placeholder="Enter email subject..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    data-testid="input-custom-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <ReactQuill
                      theme="snow"
                      value={customHtml}
                      onChange={setCustomHtml}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Compose your email..."
                      style={{ minHeight: '300px' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available placeholders: {"{{username}}"}, {"{{firstname}}"}, {"{{lastname}}"}, {"{{email}}"}
                  </p>
                </div>

                {customSubject && customHtml && (
                  <Button
                    variant="outline"
                    onClick={() => setSaveTemplateOpen(true)}
                    data-testid="button-save-template"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Template
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients
            </CardTitle>
            <CardDescription>
              Search for users, or load all users from the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
                data-testid="input-user-search"
              />
              <Button onClick={handleSearch} disabled={userSearch.length < 1} data-testid="button-search-users">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                variant="secondary" 
                onClick={loadAllUsers} 
                disabled={isLoadingAllUsers}
                data-testid="button-load-all-users"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isLoadingAllUsers ? allUsersProgress : "Load All Users"}
              </Button>
            </div>

            {usersLoading && <p className="text-sm text-muted-foreground">Searching...</p>}

            {searchResults.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.slice(0, 10).map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.some(u => u._id === user._id)}
                            onCheckedChange={() => toggleUserSelection(user)}
                            data-testid={`checkbox-user-${user._id}`}
                          />
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.userName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Selected Users ({selectedUsers.length})</p>
                  <Button variant="ghost" size="sm" onClick={clearSelectedUsers} data-testid="button-clear-selected">
                    Clear All
                  </Button>
                </div>
                {selectedUsers.length <= 10 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge key={user._id} variant="secondary" size="sm" className="flex items-center gap-1">
                        {user.email}
                        <button onClick={() => removeSelectedUser(user._id)} className="ml-1" data-testid={`button-remove-user-${user._id}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {selectedUsers.length} users selected for bulk email
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV (Optional)
            </CardTitle>
            <CardDescription>
              Or upload a CSV file with an 'email' column and columns matching template placeholders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-sm"
                data-testid="input-csv-upload"
              />
              {fileName && (
                <Button variant="ghost" size="icon" onClick={clearCsv} data-testid="button-clear-csv">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {fileName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {fileName} - {csvData.length} valid emails
              </div>
            )}

            {missingPlaceholders.length > 0 && csvData.length > 0 && emailMode === "template" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing columns</AlertTitle>
                <AlertDescription>
                  Your CSV is missing these required columns: {missingPlaceholders.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            {csvData.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvHeaders.slice(0, 5).map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                      {csvHeaders.length > 5 && <TableHead>...</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {csvHeaders.slice(0, 5).map((header) => (
                          <TableCell key={header} className="max-w-[200px] truncate">
                            {row[header]}
                          </TableCell>
                        ))}
                        {csvHeaders.length > 5 && <TableCell>...</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 5 && (
                  <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                    Showing 5 of {csvData.length} rows
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isSending && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sending emails...</span>
                  <span>{sendingProgress}%</span>
                </div>
                <Progress value={sendingProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {sendResults.success > 0 || sendResults.failed > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Send Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>{sendResults.success} sent successfully</span>
                </div>
                {sendResults.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span>{sendResults.failed} failed</span>
                  </div>
                )}
              </div>
              {sendResults.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground">
                  {sendResults.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!canPreview()}
            data-testid="button-preview"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Email
          </Button>
          <Button
            onClick={sendBulkEmails}
            disabled={!canSend() || isSending}
            data-testid="button-send-bulk"
          >
            <Send className="h-4 w-4 mr-2" />
            Send to {totalRecipients} Recipients
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              {emailMode === "custom" ? `Subject: ${customSubject}` : `Preview of email to ${getAllRecipients()[0]?.email || 'first recipient'}`}
            </DialogDescription>
          </DialogHeader>
          <div 
            className="border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this email as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Welcome Email"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                data-testid="input-template-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-slug">Template Slug</Label>
              <Input
                id="template-slug"
                placeholder="e.g., welcome-email"
                value={templateSlug}
                onChange={(e) => setTemplateSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                data-testid="input-template-slug"
              />
              <p className="text-sm text-muted-foreground">
                Unique identifier for the template (lowercase, no spaces)
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAsTemplate} disabled={isSavingTemplate} data-testid="button-confirm-save-template">
              {isSavingTemplate ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplateData?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTemplate} 
              disabled={isDeletingTemplate}
              data-testid="button-confirm-delete-template"
            >
              {isDeletingTemplate ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
