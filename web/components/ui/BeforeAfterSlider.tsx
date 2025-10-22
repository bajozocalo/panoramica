'use client';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

export const BeforeAfterSlider = () => {
  return (
    <ReactCompareSlider
      itemOne={<ReactCompareSliderImage src="https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Image one" />}
      itemTwo={<ReactCompareSliderImage src="https://images.pexels.com/photos/7292737/pexels-photo-7292737.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Image two" />}
      className="w-full h-full rounded-2xl shadow-2xl ring-1 ring-gray-900/10"
    />
  );
};
