import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

type AddMeetingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMeetingDialog({ open, onOpenChange }: AddMeetingDialogProps) {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [prepNotes, setPrepNotes] = useState("");

  const create = useMutation({
    mutationFn: () => {
      const startAt = new Date(`${startDate}T${startTime}`);
      const endAt = new Date(`${startDate}T${endTime}`);
      return api.meetings.create({
        title: title.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: location.trim() || undefined,
        link: link.trim() || undefined,
        prepNotes: prepNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setTitle("");
      setStartDate(today);
      setStartTime("10:00");
      setEndTime("11:00");
      setLocation("");
      setLink("");
      setPrepNotes("");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add meeting" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sprint Planning"
            className="input"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
              Start
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
              End
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Location / link
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Room or Zoom link"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Prep notes
          </label>
          <textarea
            value={prepNotes}
            onChange={(e) => setPrepNotes(e.target.value)}
            rows={2}
            placeholder="Talking points, questions…"
            className="input resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onOpenChange(false)} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || create.isPending}
            className="btn btn-primary"
          >
            {create.isPending ? "Adding…" : "Add meeting"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
