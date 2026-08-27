"use client";

import Popover from "@/components/ui/Popover";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
  "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
  "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
  "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲",
  "🥺", "😢", "😭", "😱", "😤", "😡", "🤬", "💀", "👍", "👎", "👏", "🙌", "🙏", "👋", "🤝", "💪",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💯", "🔥", "✨", "🎉", "🎊", "👀", "💡",
];

export default function EmojiPicker({ isOpen, onClose, anchorRef, onSelect, align = "start" }) {
  return (
    <Popover isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={272} align={align}>
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-56 overflow-y-auto">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-base transition cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </Popover>
  );
}
