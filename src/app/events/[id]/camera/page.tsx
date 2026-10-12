"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Event {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  latitude: number;
  longitude: number;
  location_name: string;
  location_radius_meters: number;
  start_time: string;
  end_time: string;
  time_tolerance_minutes: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export default function CameraSubmissionPage() {
  const { user, token, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      router.push('/login');
      return;
    }
    if (token) {
      fetchEvent();
    }
  }, [user, eventId, token]);

  // Only initialize camera when component mounts for students
  useEffect(() => {
    if (user?.role === 'student') {
      initializeCamera();
    }

    // Cleanup on unmount
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps array intentional - only run once

  const fetchEvent = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const events = await response.json();
        const currentEvent = events.find((e: any) => e.id == eventId);
        if (currentEvent) {
          setEvent(currentEvent);
        } else {
          setError('Event not found');
        }
      } else {
        setError('Failed to load event');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const initializeCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Initializing camera...');

      // Get location first
      await getCurrentLocation();

      // Then get camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      console.log('📷 Camera stream obtained');
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('🎬 Video metadata loaded');
          setCameraReady(true);
        };
        await videoRef.current.play();
        console.log('▶️ Video playing');
      }

      setPermissionsReady(true);
    } catch (error: any) {
      console.error('❌ Camera initialization error:', error);
      if (error.name === 'NotAllowedError') {
        setError('Camera and location permissions are required. Please allow access and refresh.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Unable to access camera. Please check permissions and try again.');
      }
    }
  };

  const getCurrentLocation = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationInfo: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          setLocationData(locationInfo);
          console.log('📍 Location obtained:', locationInfo);
          resolve();
        },
        (error) => {
          console.error('📍 Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      setError('Camera not ready. Please wait...');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setError('Canvas not supported');
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          setCapturedPhoto(blob);
          setPreview(URL.createObjectURL(blob));

          // Stop camera
          if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
          }

          console.log('📸 Photo captured successfully');
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('📸 Capture error:', error);
      setError('Failed to capture photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!capturedPhoto || !event || !locationData) {
      setError('Photo and location data are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      const timestamp = new Date().getTime();
      const photoFile = new File([capturedPhoto], `photo_${timestamp}.jpg`, {
        type: 'image/jpeg'
      });

      formData.append('photo', photoFile);
      formData.append('event_id', eventId);
      formData.append('user_location', JSON.stringify(locationData));

      console.log('📤 Submitting photo...');

      const response = await fetch('/api/photo-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        const updateText = result.is_update ? 'updated and ' : '';
        const successMessage = result.message ||
          `Photo ${updateText}submitted successfully! ${result.auto_verified ? `Auto-verified and awarded ${result.points_awarded} points!` : 'Under manual review.'}`;

        setSuccess(successMessage);

        // Refresh profile to update points in the UI
        await refreshProfile();

        setTimeout(() => router.push('/'), 3000);
      } else {
        setError(result.detail || 'Failed to submit photo');
      }
    } catch (error) {
      console.error('📤 Submit error:', error);
      setError('Failed to submit photo');
    } finally {
      setSubmitting(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPreview(null);
    setError(null);
    setCameraReady(false);
    initializeCamera();
  };

  const getCategoryIconInfo = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'cultural':
        return { icon: 'palette', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' };
      case 'community service':
        return { icon: 'volunteer_activism', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' };
      case 'technical':
        return { icon: 'computer', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' };
      case 'sports':
        return { icon: 'sports_basketball', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' };
      case 'professional':
        return { icon: 'work', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' };
      case 'national initiative':
        return { icon: 'flag', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' };
      default:
        return { icon: 'event', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' };
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-snow">
        <div className="text-xs font-bold text-ink-soft uppercase tracking-wide animate-pulse">Loading camera verification...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-snow">
        <div className="text-center space-y-6 px-6">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Event Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="btn-3d w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryIconInfo(event.category);

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-snow relative pb-24 overflow-hidden text-ink flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pt-8 pb-4">
        <Link href="/events" aria-label="Back to events" className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ink-soft hover:bg-snow-deep hover:text-ink">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-display text-[26px] font-semibold leading-tight text-ink">Check in</h1>
      </header>

      <main className="flex-1 px-6 py-6 pb-28 space-y-6">
        {/* Event Info */}
        <div className="rounded-3xl p-6 bg-white border-2 border-line">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-2xl bg-glacier-soft text-glacier flex items-center justify-center ">
              <span className="material-icons-outlined text-xl">{categoryInfo.icon}</span>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-ink leading-tight">{event.name}</h3>
              <p className="text-[13px] text-ink-soft font-bold uppercase tracking-wider mt-0.5">{event.category} • {event.points} PTS</p>
            </div>
          </div>

          <p className="text-xs text-ink-soft font-medium mb-4 leading-relaxed">{event.description}</p>

          <div className="flex items-center gap-2 text-xs text-ink-soft font-bold uppercase tracking-wider pt-3 border-t border-line">
            <span className="material-icons-outlined text-sm">location_on</span>
            <span>{event.location_name}</span>
            {locationData && (
              <span className="ml-auto text-moss-shade">• Location Verified</span>
            )}
          </div>
        </div>

        {/* Camera Interface */}
        <div className="rounded-3xl p-6 bg-white border-2 border-line">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink-soft mb-4">Take Event Photo</h3>

          {error && (
            <div className="bg-berry-soft rounded-2xl p-4 mb-4 text-center ">
              <p className="text-berry-shade text-xs font-bold uppercase tracking-wider">{error}</p>
              <button
                onClick={initializeCamera}
                className="mt-3 btn-3d !min-h-[2.5rem] !text-[13px]"
              >
                Try Again
              </button>
            </div>
          )}

          {success && (
            <div className="bg-moss-soft rounded-2xl p-4 mb-4 text-center ">
              <p className="text-moss-shade text-xs font-bold uppercase tracking-wider">{success}</p>
            </div>
          )}

          {!capturedPhoto ? (
            /* Camera View */
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden bg-black ">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />

                {!permissionsReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/85">
                    <div className="text-center text-white p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                      <p className="text-xs font-bold uppercase tracking-wider">Requesting permissions...</p>
                      <p className="text-[13px] text-ink-soft mt-1 uppercase font-semibold">Camera and location access required</p>
                    </div>
                  </div>
                )}

                {permissionsReady && !cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/85">
                    <div className="text-center text-white p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                      <p className="text-xs font-bold uppercase tracking-wider">Loading camera...</p>
                    </div>
                  </div>
                )}
              </div>

              {permissionsReady && cameraReady && (
                <div className="flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-moss text-white shadow-[0_6px_0_#14733D] transition-transform active:translate-y-[6px] active:shadow-none"
                  >
                    <span className="material-icons-outlined text-3xl">camera_alt</span>
                  </button>
                </div>
              )}

              {!permissionsReady && (
                <div className="text-center py-4">
                  <button
                    onClick={initializeCamera}
                    className="btn-3d w-full"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {permissionsReady && (
                <div className="p-5 bg-snow  border border-line rounded-3xl">
                  <h4 className="text-[13px] font-bold uppercase tracking-wide text-ink mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">info</span> Requirements
                  </h4>
                  <ul className="text-[13px] font-medium text-ink-soft space-y-1.5 list-disc pl-4">
                    <li>Confirm you are physically at the event location.</li>
                    <li>Ensure the photo is clear and contains activity proof.</li>
                    <li>The system will auto-verify your location data.</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Photo Preview */
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden ">
                <img src={preview!} alt="Captured" className="w-full h-64 object-cover" />
              </div>

              <div className="p-5 bg-snow  border border-line rounded-3xl text-center">
                <h4 className="text-[13px] font-bold uppercase tracking-wide text-moss-shade mb-1 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Ready to Submit
                </h4>
                <p className="text-[13px] font-bold text-ink-soft uppercase tracking-wide">
                  Location data locked in. Submit to claim {event.points} PTS.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={retakePhoto}
                  className="btn-3d btn-ghost flex-1"
                >
                  Retake
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-3d btn-moss flex-1"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons-outlined text-sm">send</span>
                      <span>Submit Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
