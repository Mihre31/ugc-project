import React, { useEffect, useRef, useState } from "react";
import type { Project } from "../types";
import { useNavigate } from "react-router-dom";
import {
  EllipsisIcon,
  ImageIcon,
  Loader2Icon,
  PlaySquareIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "./Buttons";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/axios";
import toast from "react-hot-toast";

const ProjectCard = ({
  gen,
  setGenerations,
  forCommunity = false,
}: {
  gen: Project;
  setGenerations: React.Dispatch<React.SetStateAction<Project[]>>;
  forCommunity?: boolean;
}) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?",
    );
    if (!confirmDelete) return;

    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/project/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGenerations((generations) =>
        generations.filter((currentGen) => currentGen.id !== id),
      );
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    } finally {
      setMenuOpen(false);
    }
  };

  const togglePublish = async (projectId: string) => {
    try {
      const token = await getToken();
      const { data } = await api.patch(
        `/api/user/projects/${projectId}/publish`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setGenerations((generations) =>
        generations.map((currentGen) =>
          currentGen.id === projectId
            ? { ...currentGen, isPublished: data.isPublished }
            : currentGen,
        ),
      );

      toast.success(
        data.isPublished ? "Project Published" : "Project Unpublished",
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }
  };

  const handleShare = async () => {
    try {
      if (!navigator.share) {
        toast.error("Share is not supported on this browser");
        return;
      }

      await navigator.share({
        url: gen.generatedVideo || gen.generatedImage,
        title: gen.productName,
        text: gen.productDescription,
      });
    } catch {
      // User canceled share; no toast needed.
    }
  };

  const handlePreviewMouseEnter = async () => {
    setIsPreviewHovered(true);

    if (videoRef.current) {
      try {
        await videoRef.current.play();
      } catch {
        // Autoplay may be blocked in some browsers.
      }
    }
  };

  const handlePreviewMouseLeave = () => {
    setIsPreviewHovered(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div id={gen.id} className="mb-4 break-inside-avoid">
      <div className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-white/20">
        {/*Preview */}
        <div
          className={`${gen?.aspectRatio === "9:16" ? "aspect-9/16" : "aspect-video"} relative overflow-hidden`}
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
        >
          {gen.generatedImage && (
            <img
              src={gen.generatedImage}
              alt={gen.productName}
              className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${gen.generatedVideo ? (isPreviewHovered ? "opacity-0" : "opacity-100") : "group-hover:scale-105"}`}
            />
          )}

          {gen.generatedVideo && (
            <video
              ref={videoRef}
              src={gen.generatedVideo}
              muted
              loop
              playsInline
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition duration-500 ${isPreviewHovered ? "opacity-100" : "opacity-0"}`}
            />
          )}

          {!gen.generatedImage && !gen?.generatedVideo && (
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/20">
              <Loader2Icon className="size-7 animate-spin" />
            </div>
          )}

          {/*status badges */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {gen.isGenerating && (
              <span className="rounded-full bg-yellow-600/30 px-2 py-1 text-xs">
                Generating
              </span>
            )}
            {gen.isPublished && (
              <span className="rounded-full bg-green-600/30 px-2 py-1 text-xs">
                Published
              </span>
            )}
          </div>

          {/*action menu for my generation only */}
          {!forCommunity && (
            <div ref={menuRef} className="absolute right-3 top-3 z-20">
              <button
                type="button"
                aria-label="Project actions"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="ml-auto size-8 rounded-full bg-black/40 p-1.5 text-white"
              >
                <EllipsisIcon className="size-5" />
              </button>

              {menuOpen && (
                <ul className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-500/50 bg-black/70 py-1 text-xs text-white shadow-md backdrop-blur">
                  {gen.generatedImage && (
                    <li>
                      <a
                        href={gen.generatedImage}
                        download
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-black/20"
                      >
                        <ImageIcon size={14} />
                        Download Image
                      </a>
                    </li>
                  )}
                  {gen.generatedVideo && (
                    <li>
                      <a
                        href={gen.generatedVideo}
                        download
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-black/20"
                      >
                        <PlaySquareIcon size={14} />
                        Download Video
                      </a>
                    </li>
                  )}
                  {(gen.generatedVideo || gen.generatedImage) && (
                    <li>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 hover:bg-black/20"
                      >
                        <Share2Icon size={14} />
                        Share
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onClick={() => handleDelete(gen.id)}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-950/20"
                    >
                      <Trash2Icon size={14} />
                      Delete
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}

          {/*source images */}
          <div className="absolute bottom-3 right-3">
            <img
              src={gen.uploadedImages[0]}
              alt="product"
              className="h-16 w-16 animate-float rounded-full object-cover"
            />
            <img
              src={gen.uploadedImages[1]}
              alt="model"
              className="-ml-8 h-16 w-16 animate-float rounded-full object-cover"
            />
          </div>
        </div>

        {/*Details */}
        <div className="p-4">
          {/*product name, date and aspect ratio */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-medium">{gen.productName}</h3>
              <p className="text-sm text-gray-400">
                created: {new Date(gen.createdAt).toLocaleString()}
              </p>
              {gen.updatedAt && (
                <p className="mt-1 text-xs text-gray-500">
                  updated: {new Date(gen.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="mt-2 flex flex-col items-end gap-1">
                <span className="rounded-full bg-white/5 px-2 py-1 text-xs">
                  Aspect: {gen.aspectRatio}
                </span>
              </div>
            </div>
          </div>

          {/*Product description */}
          {gen.productDescription && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-gray-400">Description</p>
              <div className="wrap-break-word rounded-md bg-white/3 p-2 text-sm text-gray-300">
                {gen.productDescription}
              </div>
            </div>
          )}

          {/*User prompt*/}
          {gen.userPrompt && (
            <div className="mt-3">
              <div className="text-sm text-gray-300">{gen.userPrompt}</div>
            </div>
          )}

          {/*Buttons*/}
          {!forCommunity && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <GhostButton
                className="justify-center text-xs"
                onClick={() => {
                  navigate(`/result/${gen.id}`);
                  scrollTo(0, 0);
                }}
              >
                View Details
              </GhostButton>
              <PrimaryButton
                className="rounded-md"
                onClick={() => {
                  togglePublish(gen.id);
                }}
              >
                {gen.isPublished ? "Unpublish" : "Publish"}
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;



