'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores/authStore';

interface LoginFormValues {
    username: string;
    password: string;
    rememberMe: boolean;
}

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        defaultValues: {
            username: '',
            password: '',
            rememberMe: false,
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await login(data.username, data.password);
            toast.success('Login berhasil!');
            router.push('/');
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Login gagal. Periksa username dan password Anda.';
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md space-y-8 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        {/* <div className="relative w-24 h-24">
                            <Image
                                src="https://www.kurniasylva.com/wp-content/uploads/2024/09/cropped-logo-ksc-scaled-1.jpg"
                                // src="/logo-ksc.jpg"
                                alt="KSC Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div> */}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">
                        KSC Management System
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Masuk untuk mengakses dashboard proyek
                    </p>
                </div>

                <Card className="border-muted shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>
                            Masukkan username dan password Anda untuk melanjutkan
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        placeholder="username"
                                        type="text"
                                        className="pl-9"
                                        disabled={isLoading}
                                        autoComplete="username"
                                        {...register('username', {
                                            required: 'Username harus diisi',
                                            minLength: {
                                                value: 3,
                                                message: 'Username minimal 3 karakter',
                                            },
                                        })}
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-xs text-red-500">{errors.username.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="pl-9 pr-9"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                        {...register('password', { required: 'Password harus diisi' })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        {...register('rememberMe')}
                                    />
                                    <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Ingat saya
                                    </Label>
                                </div>
                                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                                    Lupa password?
                                </a>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sedang masuk...
                                    </>
                                ) : (
                                    'Masuk'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
