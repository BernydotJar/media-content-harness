import { expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function verifyQuickCreateEmpty(page) {
  const create=page.getByRole('button',{name:'Crear',exact:true})
  await create.click()
  await expect(page.getByRole('menuitem',{name:/Crear un espacio de trabajo/})).toHaveAttribute('href','/workspaces')
  await expect(page.getByRole('menuitem',{name:/Producción semanal/})).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(create).toBeFocused()
  return 'quick create without tenants offers only workspace onboarding'
}

export async function verifyCreativeNavigation({page,context,origin,temp}) {
  const checks=[]
  await page.setViewportSize({width:1440,height:1000})
  await page.goto(origin+'/dashboard')
  const create=page.getByRole('button',{name:'Crear',exact:true})
  const weekly=page.getByRole('menuitem',{name:/^Producción semanal/})
  const free=page.getByRole('menuitem',{name:/^Modo libre/})
  const first=page.getByRole('menuitem',{name:'Estudio de verificación A',exact:true})
  const second=page.getByRole('menuitem',{name:'Estudio de verificación B',exact:true})
  await create.focus()
  await create.press('Enter')
  await expect(weekly).toBeFocused()
  await weekly.press('ArrowRight')
  await expect(first).toBeFocused()
  await first.press('ArrowDown')
  await expect(second).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(create).toBeFocused()
  await expect(page.getByRole('menu')).toHaveCount(0)
  checks.push('quick create keyboard submenu and Escape restore focus')

  await create.press('Enter')
  await weekly.press('ArrowDown')
  await expect(free).toBeFocused()
  await free.press('ArrowRight')
  await expect(first).toBeFocused()
  await first.press('Enter')
  await expect(page).toHaveURL(origin+'/workspace/browser-a/free')
  checks.push('quick create keyboard selection navigates to the existing tenant Free Mode')

  await create.click()
  await weekly.hover()
  await expect(second).toBeVisible()
  const parent=await weekly.boundingBox(),target=await second.boundingBox()
  assert.ok(parent&&target)
  const opensRight=target.x>parent.x
  await page.mouse.move(opensRight?parent.x+8:parent.x+parent.width-8,parent.y+parent.height/2)
  await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12})
  await expect(weekly).toHaveAttribute('data-state','open')
  await expect(second).toBeVisible()
  await expect(second).toBeFocused()
  await page.screenshot({path:join(temp,'creative-menu-desktop.png'),fullPage:true})
  await page.keyboard.press('Escape')
  checks.push('safe diagonal pointer path preserves the intended submenu across sibling rows')

  const browser=context.browser()
  assert.ok(browser)
  const touch=await browser.newContext({storageState:await context.storageState(),viewport:{width:390,height:844},hasTouch:true,isMobile:true})
  try {
    const touchPage=await touch.newPage(),errors=[]
    touchPage.on('pageerror',error=>errors.push(error.message))
    await touchPage.goto(origin+'/dashboard')
    await touchPage.getByRole('button',{name:'Crear',exact:true}).tap()
    await touchPage.getByRole('menuitem',{name:/^Producción semanal/}).tap()
    const target=touchPage.getByRole('menuitem',{name:'Estudio de verificación B',exact:true})
    await expect(target).toBeVisible()
    await touchPage.screenshot({path:join(temp,'creative-menu-mobile.png'),fullPage:true})
    await target.tap()
    await expect(touchPage).toHaveURL(origin+'/workspace/browser-b/weekly')
    assert.equal(await touchPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true)
    assert.deepEqual(errors,[])
  } finally { await touch.close() }
  checks.push('touch opens a submenu and navigates without hover or horizontal overflow')

  let resume
  const hold=new Promise(resolve=>{resume=resolve})
  const endpoint=origin+'/api/v1/me'
  const pending=new Set(),routeErrors=[]
  const delay=route=>{const operation=hold.then(()=>route.continue()).catch(error=>{routeErrors.push(error)}).finally(()=>pending.delete(operation));pending.add(operation);return operation}
  let probeError
  await page.route(endpoint,delay)
  try {
    await page.emulateMedia({reducedMotion:'reduce'})
    await page.goto(origin+'/dashboard',{waitUntil:'domcontentloaded'})
    const status=page.getByRole('status'),orb=page.locator('[data-creative-activity]').first()
    await expect(status).toContainText('Cargando tu estudio')
    await expect(orb).toBeVisible()
    await expect(orb).toHaveAttribute('aria-hidden','true')
    await expect(orb).toHaveAttribute('data-motion','paused')
    await expect(status.getByRole('img')).toHaveCount(0)
    await page.emulateMedia({reducedMotion:'no-preference'})
    await expect(orb).toHaveAttribute('data-motion','active')
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'))})
    await expect(orb).toHaveAttribute('data-motion','paused')
    await page.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'))})
    await expect(orb).toHaveAttribute('data-motion','active')
  } catch(error) { probeError=error } finally {
    resume()
    while(pending.size)await Promise.all([...pending])
    try { await page.unroute(endpoint,delay) } catch(error) { routeErrors.push(error) }
    while(pending.size)await Promise.all([...pending])
  }
  if(probeError)throw probeError
  if(routeErrors.length)throw routeErrors[0]
  await expect(page.getByRole('button',{name:'Crear',exact:true})).toBeVisible()
  checks.push('real request loading retains accessible status and pauses decorative orb for reduced motion and simulated hidden visibility')
  await writeFile(join(temp,'creative-navigation-checks.json'),JSON.stringify({checks,visibility_test:'simulated visibilitychange while a real GET /me is delayed'},null,2))
  return checks
}
