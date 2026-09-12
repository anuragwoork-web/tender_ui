import { ref, watch } from "vue";

const STORAGE_KEY = "tender_bookmarks";

const stored = localStorage.getItem(STORAGE_KEY);
const bookmarks = ref(stored ? JSON.parse(stored) : []);

watch(bookmarks, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}, { deep: true });

export function useBookmarks() {
  const isBookmarked = (id) => bookmarks.value.some((b) => b.id === id);

  const add = (tender) => {
    if (!isBookmarked(tender.id)) {
      bookmarks.value.push({
        id: tender.id,
        title: tender.title,
        tender_reference: tender.tender_reference,
        organisation_name: tender.organisation_name,
        closing_date: tender.closing_date,
        portal_code: tender.portal_code,
        bookmarked_at: new Date().toISOString(),
      });
    }
  };

  const remove = (id) => {
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id);
  };

  const toggle = (tender) => {
    if (isBookmarked(tender.id)) remove(tender.id);
    else add(tender);
  };

  return { bookmarks, isBookmarked, add, remove, toggle };
}
