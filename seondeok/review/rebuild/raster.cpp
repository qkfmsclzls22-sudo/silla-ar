#include <cmath>
#include <algorithm>
#include <cstdint>
extern "C" void raster(int nv,int nf,const float* p,const float* n,const float* t,const float* uv,const float* col,const int32_t* f,int mat,int w,int h,float* depth,float* no,float* ta,float* tex,float* co,int32_t* ids){
 for(int k=0;k<nf;k++){
  int a=f[k*3],b=f[k*3+1],c=f[k*3+2];
  float ax=p[a*3],ay=p[a*3+1],bx=p[b*3],by=p[b*3+1],cx=p[c*3],cy=p[c*3+1];
  int x0=std::max(0,(int)std::ceil(std::min({ax,bx,cx})-.5f)), x1=std::min(w-1,(int)std::floor(std::max({ax,bx,cx})-.5f));
  int y0=std::max(0,(int)std::ceil(std::min({ay,by,cy})-.5f)), y1=std::min(h-1,(int)std::floor(std::max({ay,by,cy})-.5f));
  float den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy); if(std::abs(den)<1e-12)continue;
  for(int y=y0;y<=y1;y++)for(int x=x0;x<=x1;x++){
   float wa=((by-cy)*(x+.5f-cx)+(cx-bx)*(y+.5f-cy))/den;
   float wb=((cy-ay)*(x+.5f-cx)+(ax-cx)*(y+.5f-cy))/den,wc=1-wa-wb;
   if(wa<-.00001f||wb<-.00001f||wc<-.00001f)continue;
   int q=y*w+x;float z=wa*p[a*3+2]+wb*p[b*3+2]+wc*p[c*3+2];if(z<=depth[q])continue;
   depth[q]=z;ids[q]=mat;
   for(int j=0;j<3;j++)no[q*3+j]=wa*n[a*3+j]+wb*n[b*3+j]+wc*n[c*3+j];
   for(int j=0;j<4;j++)ta[q*4+j]=wa*t[a*4+j]+wb*t[b*4+j]+wc*t[c*4+j];
   for(int j=0;j<2;j++)tex[q*2+j]=wa*uv[a*2+j]+wb*uv[b*2+j]+wc*uv[c*2+j];
   for(int j=0;j<3;j++)co[q*3+j]=wa*col[a*3+j]+wb*col[b*3+j]+wc*col[c*3+j];
  }
 }
}
