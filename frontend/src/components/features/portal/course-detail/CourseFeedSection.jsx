"use client";

import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { getCourseFeed } from "@/services/classFeedService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import FeedPostCard from "@/components/features/classFeed/FeedPostCard";

export default function CourseFeedSection({ courseId }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["courseFeed", courseId],
    queryFn: async () => {
      const response = await getCourseFeed(courseId);
      return response?.data?.results || [];
    },
    enabled: Boolean(courseId),
  });

  const posts = data || [];

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-28 rounded-2xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-rose-600">
        {getApiErrorMessage(error, "Unable to load the class feed.")}
      </p>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-serif font-bold text-stone-900 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-700" />
          Class Feed
        </h4>
        <p className="text-sm text-stone-500 font-light mt-0.5">
          Updates and short videos your instructor has shared with this class.
        </p>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
