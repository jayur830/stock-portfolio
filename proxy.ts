import type { NextRequest } from 'next/server';
import { NextResponse, userAgent } from 'next/server';

export async function proxy(request: NextRequest) {
  const agent = userAgent({ headers: request.headers });

  /** 모바일 주소로 접속한 요청이 앱 요청이 아닌 경우 */
  if (process.env.NODE_ENV === 'production') {
    if (request.nextUrl.pathname.startsWith('/m/') && agent.browser.name && !['Chrome WebView', 'WebKit'].includes(agent.browser.name)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    } else if (!request.nextUrl.pathname.startsWith('/m/') && agent.browser.name && ['Chrome WebView', 'WebKit'].includes(agent.browser.name)) {
      const url = request.nextUrl.clone();
      url.pathname = '/m';
      return NextResponse.redirect(url);
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
