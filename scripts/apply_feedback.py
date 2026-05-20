# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

INSTA_SLIDES = (
    '                                <motion-div class="swiper-slide">\n'
)
INSTA_SLIDES = (
    '                                <div class="swiper-slide">\n'
    '                                    <a href="https://www.instagram.com/p/DPYyt3fkzf7/" target="_blank"\n'
    '                                        rel="noopener noreferrer">\n'
    '                                        <img src="assets/images/insta/insta1.jpg" alt="instafeed">\n'
    '                                    </a>\n'
    '                                </div>\n'
    '                                <div class="swiper-slide">\n'
    '                                    <a href="https://www.instagram.com/p/DKmxcM1z0An/" target="_blank"\n'
    '                                        rel="noopener noreferrer">\n'
    '                                        <img src="assets/images/insta/instagram_02.jpg" alt="instafeed">\n'
    '                                    </a>\n'
    '                                </div>\n'
    '                                <div class="swiper-slide">\n'
    '                                    <a href="https://www.instagram.com/p/DXEqcuVE1Z8/" target="_blank"\n'
    '                                        rel="noopener noreferrer">\n'
    '                                        <img src="assets/images/insta/instagram_03.jpg" alt="instafeed">\n'
    '                                    </a>\n'
    '                                </div>\n'
    '                                <motion-div class="swiper-slide">\n'
)
