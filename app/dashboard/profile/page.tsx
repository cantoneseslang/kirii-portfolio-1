"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { getProfile, updateProfile, createProfile, checkProfilesTable } from "@/utils/profile"
import type { Profile } from "@/types/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [isCheckingTable, setIsCheckingTable] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      checkTable()
    }
  }, [user, isLoading, router])

  const checkTable = async () => {
    setIsCheckingTable(true)
    const exists = await checkProfilesTable()
    setTableExists(exists)
    setIsCheckingTable(false)

    if (exists && user) {
      loadProfile()
    }
  }

  // loadProfile関数を修正
  const loadProfile = async () => {
    if (!user) return

    setStatus("Loading profile...")

    try {
      const profileData = await getProfile(user.id)

      if (!profileData) {
        // プロフィールが存在しない場合は作成を試みる
        setStatus("Creating new profile...")
        const result = await createProfile(user.id)
        if (!result.success) {
          setStatus(`Error creating profile: ${result.error}`)
          return
        }
        setProfile({ id: user.id })
      } else {
        setProfile(profileData)
      }
      setStatus(null)
    } catch (error: any) {
      setStatus(`Error loading profile: ${error.message}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setStatus("Updating profile...")

    try {
      const result = await updateProfile({
        ...profile,
        id: user.id,
      })

      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        })
        setStatus(null)
      } else {
        setStatus(`Error updating profile: ${result.error}`)
        toast({
          title: "Update Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    })
  }

  if (isLoading || isCheckingTable) {
    return (
      <div className="container py-10">
        <p>Loading...</p>
      </div>
    )
  }

  if (tableExists === false) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Setup Required</AlertTitle>
          <AlertDescription>
            The profiles table does not exist in the database. Please create it using the SQL Editor in Supabase.
            <div className="mt-4">
              <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto text-xs">
                {`-- プロフィールテーブルの作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  PRIMARY KEY (id)
);

-- セキュリティのためのRLS（Row Level Security）ポリシーを設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーが自分のプロフィールのみを参照できるポリシー
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- 認証されたユーザーが自分のプロフィールのみを更新できるポリシー
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 新規ユーザー登録時に自動的にプロフィールレコードを作成するトリガー関数
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, updated_at)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersテーブルに新しいレコードが挿入されたときにトリガーを実行
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`}
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={profile.username || ""}
                onChange={handleChange}
                placeholder="Enter a username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={profile.full_name || ""}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                value={profile.department || ""}
                onChange={handleChange}
                placeholder="Enter your department"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                name="position"
                value={profile.position || ""}
                onChange={handleChange}
                placeholder="Enter your position"
              />
            </div>

            {status && (
              <Alert>
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

