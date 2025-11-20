
import { useContext, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthReqParams } from "@/models/Auth/authReqParams";
import { toast } from "@/hooks/use-toast";
import { AuthResponse } from "@/models/Auth/authResponse";
import { Toaster } from "@/components/ui/toaster";
import { useAppDispatch } from "@/store/hook";
import { useAuth } from "@/contexts/AuthContext";
import { handleFetchCurrentUser } from "@/services/administration/administrationRequest";

export default function LoginPage() {
  
  const dispatch = useAppDispatch()
  const authContext = useContext(useAuth())

  const router = useRouter();
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // // Mock login for now - would connect to backend when available
      // console.log("Login attempt with:", { email, password });

      // // Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 1000));

      // // For demo purposes - would be replaced with actual auth
      // if (email === "demo@example.com" && password === "password") {
      //   router.push("/");
      // } else {
      //   setError("Invalid email or password");
      // }

      const email = emailRef.current.value;
      const password = passwordRef.current.value;
      if (!email || email?.length === 0 || !password || password?.length === 0) {
        toast({
          title: 'Missing required fields',
          description: 'Email and password must be entered',
          style: { background: 'red', color: 'white' }, duration: 2500
        })
        return
      }

      const params: AuthReqParams = { email: email, password: password }
      console.log('Params', params)
      
      const rawResponse = await fetch('/api/administrators/login',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params),

        }
      );

      const data: AuthResponse = await rawResponse.json();
      console.log('data :', data)

      authContext?.setToken(data?.accessToken ?? undefined)
      
      if (data?.accessToken) {
        // Fetch user details after successful login
        try {
          const userResponse = await handleFetchCurrentUser(data.accessToken);
          if (userResponse.data) {
            authContext?.setUserDetails(userResponse.data);
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          // Continue with login even if user details fetch fails
        }
        
        toast({ title: 'Redirecting...', style: { background: 'green', color: 'white' }, duration: 1500 })
        router.push("/admin");
      }
      else if (data?.error)
        toast({ title: data?.error, style: { background: 'red', color: 'white' }, duration: 3500 })

    } catch (err) {
      setError("An error occurred during login");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="Login to your account" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    // value={email}
                    // onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    // value={password}
                    // onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
