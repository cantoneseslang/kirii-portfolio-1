"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { updateUserAdmin, createUser, deleteUser } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/types/profile"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface AdminDashboardProps {
  users: Profile[]
}

export function AdminDashboard({ users: initialUsers }: AdminDashboardProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // 新規ユーザー用のフォームの状態
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    department: "",
    position: "",
    is_admin: false,
  })

  const handleAdminToggle = async (userId: string, currentValue: boolean) => {
    setUpdatingUser(userId)

    try {
      const { success, error } = await updateUserAdmin(userId, !currentValue)

      if (success) {
        // ローカルのユーザーリストを更新
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, is_admin: !currentValue } : user
          )
        )
        
        toast({
          title: "成功",
          description: "ユーザーの管理者権限が更新されました",
        })
      } else {
        toast({
          title: "エラー",
          description: error || "ユーザーの管理者権限の更新に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "予期せぬエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setUpdatingUser(null)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const { success, error, userId } = await createUser(
        newUser.email,
        newUser.full_name,
        newUser.department,
        newUser.position,
        newUser.is_admin
      )

      if (success && userId) {
        // ローカルのユーザーリストに追加
        const newUserProfile: Profile = {
          id: userId,
          full_name: newUser.full_name,
          department: newUser.department,
          position: newUser.position,
          is_admin: newUser.is_admin,
        }
        
        setUsers([...users, newUserProfile])
        
        // フォームをリセット
        setNewUser({
          email: "",
          full_name: "",
          department: "",
          position: "",
          is_admin: false,
        })
        
        setIsAddUserDialogOpen(false)
        
        toast({
          title: "成功",
          description: "ユーザーが作成されました",
        })
      } else {
        toast({
          title: "エラー",
          description: error || "ユーザーの作成に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "予期せぬエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    setIsProcessing(true)
    
    try {
      const { success, error } = await deleteUser(userToDelete.id)
      
      if (success) {
        // ローカルのユーザーリストから削除
        setUsers(users.filter((user) => user.id !== userToDelete.id))
        
        setIsDeleteDialogOpen(false)
        setUserToDelete(null)
        
        toast({
          title: "成功",
          description: "ユーザーが削除されました",
        })
      } else {
        toast({
          title: "エラー",
          description: error || "ユーザーの削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "予期せぬエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ユーザー管理</CardTitle>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>ユーザーを追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規ユーザーを追加</DialogTitle>
                <DialogDescription>
                  新しいユーザーの情報を入力してください。
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">名前</Label>
                    <Input
                      id="full_name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">部門</Label>
                    <Input
                      id="department"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position">役職</Label>
                    <Input
                      id="position"
                      value={newUser.position}
                      onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_admin"
                      checked={newUser.is_admin}
                      onCheckedChange={(checked) => setNewUser({ ...newUser, is_admin: checked })}
                    />
                    <Label htmlFor="is_admin">管理者権限</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? "処理中..." : "ユーザーを作成"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p>ユーザーが見つかりません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>役職</TableHead>
                  <TableHead>管理者</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || "未設定"}</TableCell>
                    <TableCell>{user.department || "未設定"}</TableCell>
                    <TableCell>{user.position || "未設定"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!user.is_admin}
                        disabled={updatingUser === user.id}
                        onCheckedChange={() => handleAdminToggle(user.id, !!user.is_admin)}
                      />
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <AlertDialog
                        open={isDeleteDialogOpen && userToDelete?.id === user.id}
                        onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open)
                          if (!open) setUserToDelete(null)
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setUserToDelete(user)}
                          >
                            削除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は元に戻せません。ユーザー "{user.full_name}" を削除してもよろしいですか？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteUser}
                              disabled={isProcessing}
                            >
                              {isProcessing ? "削除中..." : "削除"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
