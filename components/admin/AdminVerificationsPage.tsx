"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminKit";
import { createSupabaseBrowserClient } from "@/lib/supabase";

function shortId(id?: string | null) {
  return id ? id.slice(0, 8).toUpperCase() : "-";
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

type PendingProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  town_city: string | null;
  postcode: string | null;
  country: string | null;
  date_of_birth: string | null;
  verification_status: string;
};

type DocRow = {
  id: string;
  user_id: string;
  document_type: string;
  storage_path: string;
  uploaded_at: string;
  original_filename: string | null;
  mime_type: string | null;
};

export function AdminVerificationsPage() {
  const supabase = createSupabaseBrowserClient();
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [docs, setDocs] = useState<Record<string, DocRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<PendingProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    const { data: rows, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,email,address_line_1,address_line_2,town_city,postcode,country,date_of_birth,verification_status")
      .eq("verification_status", "pending")
      .order("id");

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const list = (rows ?? []) as PendingProfile[];
    setProfiles(list);

    if (!list.length) {
      setDocs({});
      setLoading(false);
      return;
    }

    const ids = list.map((p) => p.id);
    const { data: docRows, error: docError } = await supabase
      .from("account_verification_documents")
      .select("id,user_id,document_type,storage_path,uploaded_at,original_filename,mime_type")
      .eq("status", "uploaded")
      .in("user_id", ids);

    if (docError) {
      setError(docError.message);
      setDocs({});
      setLoading(false);
      return;
    }

    const next: Record<string, DocRow[]> = {};
    for (const doc of ((docRows as DocRow[]) ?? [])) {
      (next[doc.user_id] ||= []).push(doc);
    }
    setDocs(next);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const openSigned = async (path: string) => {
    if (!supabase) return;
    const { data, error: signErr } = await supabase.storage.from("account-verification").createSignedUrl(path, 300);
    if (signErr || !data?.signedUrl) {
      setMessage(signErr?.message || "Could not open document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const callReview = async (userId: string, action: "approve" | "reject", reason?: string) => {
    if (!supabase) return;
    setError(null);
    setMessage(null);
    setBusyId(userId);
    const { data, error: invokeError } = await supabase.functions.invoke("admin-review-verification", {
      body: { user_id: userId, action, rejection_reason: reason },
    });
    setBusyId(null);

    if (invokeError || (data as { error?: unknown })?.error) {
      setError(invokeError?.message || String((data as { error?: unknown })?.error) || "Review action failed.");
      return;
    }

    setMessage(action === "approve" ? "Customer verified." : "Verification rejected.");
    setRejectFor(null);
    setRejectReason("");
    void load();
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Compliance"
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Account verifications"
        subtitle="Review proof-of-id and proof-of-address documents before approving users."
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</div>
      ) : null}

      {loading ? (
        <AdminPanel><p className="text-sm admin-soft">Loading pending verifications…</p></AdminPanel>
      ) : profiles.length === 0 ? (
        <AdminPanel className="text-center p-6"><p className="text-sm admin-soft">No pending verifications. You&apos;re all caught up.</p></AdminPanel>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => {
            const profileDocs = docs[profile.id] ?? [];
            const idDoc = profileDocs.find((doc) => doc.document_type === "proof_of_id");
            const addrDoc = profileDocs.find((doc) => doc.document_type === "proof_of_address");

            return (
              <AdminPanel key={profile.id} title={profile.full_name || "(no name)"} description={profile.email || "-"}>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div className="space-y-3 text-sm">
                    <p className="admin-soft">Profile: <span className="admin-value">{shortId(profile.id)}</span></p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-white/10 bg-white/[0.03] p-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-white/45 font-bold">Address</div>
                        <div className="text-white/85 mt-0.5">
                          {[profile.address_line_1, profile.address_line_2, profile.town_city, profile.postcode, profile.country].filter(Boolean).join(", ") || "-"}
                        </div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] p-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-white/45 font-bold">Date of birth</div>
                        <div className="text-white/85 mt-0.5">{profile.date_of_birth || "-"}</div>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { label: "Proof of ID", doc: idDoc },
                        { label: "Proof of address", doc: addrDoc },
                      ].map(({ label, doc }) => (
                        <div key={label} className="rounded-md border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-white/45 font-bold">{label}</div>
                            <div className="text-sm text-white truncate">{doc?.original_filename || (doc ? "(file)" : "Missing")}</div>
                            {doc ? (
                              <div className="text-[11px] text-white/45">Uploaded {formatDate(doc.uploaded_at)} · {doc.mime_type || "file"}</div>
                            ) : null}
                          </div>
                          {doc ? (
                            <Button size="sm" variant="outline" onClick={() => openSigned(doc.storage_path)}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                          ) : (
                            <FileText className="h-4 w-4 text-white/30" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 md:items-stretch">
                    <Button
                      onClick={() => callReview(profile.id, "approve")}
                      disabled={busyId === profile.id || !idDoc || !addrDoc}
                      className="bg-success hover:bg-success/90 text-success-foreground font-bold uppercase tracking-wider"
                    >
                      {busyId === profile.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectFor(profile);
                        setRejectReason("");
                      }}
                      disabled={busyId === profile.id}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </AdminPanel>
            );
          })}
        </div>
      )}

      <Dialog open={!!rejectFor} onOpenChange={(open) => !open && (setRejectFor(null), setRejectReason(""))}>
        <DialogContent className="admin-dialog-content">
          <DialogHeader>
            <DialogTitle>Reject verification</DialogTitle>
          </DialogHeader>
          <p className="text-sm td-soft">Provide a clear reason. This will be shown to the customer and their uploaded files can be safely replaced.</p>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="e.g. blurry ID photo, please re-upload a clear copy"
            maxLength={1000}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectFor(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={!rejectReason.trim() || (rejectFor ? busyId === rejectFor.id : false)}
              onClick={() => rejectFor && callReview(rejectFor.id, "reject", rejectReason.trim())}
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
