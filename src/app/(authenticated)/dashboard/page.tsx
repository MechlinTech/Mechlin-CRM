// app/dashboard/page.tsx
import { GeneralThreads } from '@/components/custom/threads'

export default function DashboardPage() {
  return (
    <div >

        <h1>Dashboard</h1>
      
      
        
        <div className="lg:col-span-1">
          <GeneralThreads 
            title="Latest Discussions"
            showThreadList={true}
            defaultView="list"
          />
        </div>
      </div>
    


    
  );
}