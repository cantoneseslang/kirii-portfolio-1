"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { updateUserAdmin } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/types/profile"

interface AdminDashboardProps {
  users: Profile[]
}

export function AdminDashboard({ users }: AdminDashboardProps) {
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAdminToggle = async (userId: string, currentValue: boolean) => {
    setUpdatingUser(userId)

    try {
      const { success, error } = await updateUserAdmin(userId, !currentValue)

      if (success) {
        toast({
          title: "Success",
          description: "User admin status updated",
        })
      } else {
        toast({
          title: "Error",
          description: error || "Failed to update user admin status",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setUpdatingUser(null)
    }
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || "N/A"}</TableCell>
                  <TableCell>{user.department || "N/A"}</TableCell>
                  <TableCell>{user.position || "N/A"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={!!user.is_admin}
                      disabled={updatingUser === user.id}
                      onCheckedChange={() => handleAdminToggle(user.id, !!user.is_admin)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" disabled={updatingUser === user.id}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

