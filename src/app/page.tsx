import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Info, Star } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          shadcn/ui + Tailwind CSS テスト
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Buttons Card */}
          <Card>
            <CardHeader>
              <CardTitle>Button Components</CardTitle>
              <CardDescription>
                Various button styles and sizes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Button Variants */}
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              
              {/* Button Sizes */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Disabled Button */}
              <div className="flex gap-2">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>Disabled Outline</Button>
              </div>
            </CardContent>
          </Card>

          {/* Cards & Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Cards & Badges</CardTitle>
              <CardDescription>
                Various card layouts and badge styles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
              
              {/* Nested Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Nested Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This is a card inside another card
                  </p>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button size="sm" variant="outline">Action</Button>
                </CardFooter>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Alerts</h2>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is a default alert with some information.
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              This is a destructive alert indicating an error occurred.
            </AlertDescription>
          </Alert>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Bars</CardTitle>
            <CardDescription>
              Different progress indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Progress value={75} />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Loading</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <Progress value={45} />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Complete</span>
                <span className="text-sm text-muted-foreground">100%</span>
              </div>
              <Progress value={100} />
            </div>
          </CardContent>
        </Card>

        {/* Success Alert */}
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            shadcn/ui components are working perfectly with Tailwind CSS!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}