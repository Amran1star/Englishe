import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from './config'

// صفحات تتطلب تسجيل الدخول (بعضها سيُبنى في مراحل لاحقة)
const PROTECTED_PREFIXES = [
  '/dashboard', '/admin', '/profile', '/placement', '/levels', '/lessons', '/vocabulary',
  '/grammar', '/reading', '/writing', '/listening', '/tutor', '/pdf-quiz',
  '/quizzes', '/results',
]
// صفحات لا معنى لها لمن سجّل دخوله
const GUEST_ONLY = ['/login', '/register']

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(p + '/'))

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = matches(pathname, PROTECTED_PREFIXES)

  const redirectTo = (path: string, withNext = false) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ''
    if (withNext) url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (!isSupabaseConfigured()) {
    return isProtected ? redirectTo('/login', true) : NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() يتحقق من الجلسة لدى Supabase (أأمن من getSession في الخادم)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const withCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  if (!user && isProtected) return withCookies(redirectTo('/login', true))
  if (user && matches(pathname, GUEST_ONLY)) return withCookies(redirectTo('/dashboard'))

  return response
}
