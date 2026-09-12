import assert from 'node:assert/strict'
import { expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
export async function verifyStudioEntry({page,context,temp}){
 const checks=[],art=page.getByRole('figure',{name:'Arte original de Media Factory'}),hero=art.locator('img')
 await expect(hero).toBeVisible();await expect.poll(()=>hero.evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true)
 const image=await hero.evaluate(image=>({src:image.currentSrc,width:image.naturalWidth,height:image.naturalHeight,alt:image.alt}));assert.ok(image.width>=1000&&image.height>=600);assert.ok(image.alt.length>30)
 const response=await context.request.get(image.src);assert.equal(response.status(),200);const digest=bytes=>createHash('sha256').update(bytes).digest('hex'),imageSha=digest(await response.body());assert.equal(imageSha,digest(await readFile('assets/media-factory-hero.webp')))
 checks.push('original hero loads actual bundled image bytes with descriptive alternative text')
 await page.emulateMedia({reducedMotion:'no-preference'});await art.scrollIntoViewIfNeeded();await expect(art).toHaveAttribute('data-paused','false');await expect.poll(()=>hero.evaluate(image=>getComputedStyle(image).animationPlayState)).toBe('running')
 await page.getByRole('button',{name:'Pausar animación',exact:true}).click();await expect(art).toHaveAttribute('data-paused','true');await expect(page.getByRole('button',{name:'Reanudar animación',exact:true})).toHaveAttribute('aria-pressed','true');await expect.poll(()=>hero.evaluate(image=>getComputedStyle(image).animationPlayState)).toBe('paused')
 await page.getByRole('button',{name:'Reanudar animación',exact:true}).click();await expect(art).toHaveAttribute('data-paused','false')
 await page.emulateMedia({reducedMotion:'reduce'});await expect(art).toHaveAttribute('data-paused','true');await expect(page.getByRole('button',{name:'Movimiento reducido por tu preferencia del sistema'})).toBeDisabled();await expect.poll(()=>hero.evaluate(image=>getComputedStyle(image).animationName)).toBe('none')
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(art).toHaveAttribute('data-paused','false')
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await expect(art).toHaveAttribute('data-paused','true');await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await expect(art).toHaveAttribute('data-paused','false')
 checks.push('hero motion pauses on demand, reduced motion and simulated hidden-document visibility')
 await page.screenshot({path:join(temp,'login-hero-desktop.png'),fullPage:true})
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await expect(hero).toBeVisible();await expect(page.getByRole('heading',{level:1})).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true)
 const artBox=await art.boundingBox(),formBox=await page.locator('#studio-access').boundingBox();assert.ok(artBox&&formBox&&formBox.y>=artBox.y+artBox.height)
 await page.screenshot({path:join(temp,'login-hero-mobile.png'),fullPage:true});await page.getByRole('link',{name:'Entrar',exact:true}).click();await expect(page.getByLabel('Usuario o correo')).toBeVisible();await expect(page.getByRole('button',{name:'Entrar al estudio',exact:true})).toBeVisible()
 checks.push('mobile hero and accessible sign-in remain ordered with no horizontal overflow')
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.scrollTo(0,0));await writeFile(join(temp,'studio-entry-checks.json'),JSON.stringify({checks,hero:{sha256:imageSha,width:image.width,height:image.height},visibility_test:'simulated visibilitychange using document.hidden'},null,2));return checks
}
