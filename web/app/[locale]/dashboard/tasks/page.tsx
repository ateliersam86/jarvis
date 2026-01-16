'use client'

import { ListTodo } from 'lucide-react'

export default function TasksPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
        <ListTodo className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-muted-foreground max-w-md">
        Task management module is currently under development. 
        Check back soon for advanced scheduling and orchestration capabilities.
      </p>
    </div>
  )
}
