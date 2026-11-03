import { ref, watch } from "vue";
import { tenderKey } from "../utils/tender";

// v1 key: bookmarks are identified by portal + tender id (the old numeric ids of the
// legacy tables do not exist in the collector database, so old entries are not reused).
const STORAGE_KEY = "tender_bookmarks_v1";

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((b) => b && b.portal && b.tender_id) : [];
  } catch {
    return [];
  }
}

const bookmarks = ref(readStored());

watch(bookmarks, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  } catch {
    /* storage blocked — bookmarks live for this tab only */
  }
}, { deep: true });

export function useBookmarks() {
  const isBookmarked = (t) => !!t && bookmarks.value.some((b) => tenderKey(b) === tenderKey(t));

  const add = (t) => {
    if (isBookmarked(t)) return;
    bookmarks.value.push({
      portal: t.portal,
      portal_name: t.portal_name,
      tender_id: t.tender_id,
      title: t.title,
      ref_no: t.ref_no,
      org_name: t.org_name,
      org_chain: t.org_chain,
      state: t.state,
      location: t.location,
      closing_at: t.closing_at,
      lifecycle: t.lifecycle,
      estimated_value: t.estimated_value,
      emd_amount: t.emd_amount,
      bookmarked_at: new Date().toISOString(),
    });
  };

  const remove = (t) => {
    bookmarks.value = bookmarks.value.filter((b) => tenderKey(b) !== tenderKey(t));
  };

  const toggle = (t) => (isBookmarked(t) ? remove(t) : add(t));

  return { bookmarks, isBookmarked, add, remove, toggle };
}
