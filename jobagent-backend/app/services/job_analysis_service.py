from threading import Thread
from sqlalchemy.orm import Session

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .. import models
from ..database import get_db
from ..crud import get_in_progress_jobs, update_job_analysis_status
import logging as logger

class JobAnalysisService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(
            self.process_in_progress_jobs,
            trigger=IntervalTrigger(minutes=1),
            id='job_analysis_processor',
            replace_existing=True
        )
        print("Start job analysis service")
        self.scheduler.start()
        
    def process_in_progress_jobs(self):
        """每分钟检查一次IN_PROGRESS状态的job并进行分析"""
        db: Session = next(get_db())
        try:
            jobs = get_in_progress_jobs(db)
            if not jobs:
                logger.info("No jobs need analysis")
                return
            for job in jobs:
                # 为每个job启动单独的线程进行分析
                thread = Thread(target=self.analyze_job, args=(job,))
                thread.start()
        finally:
            db.close()

    def analyze_job(self, job: models.JobAnalysis):
        """分析job失败原因"""
        db: Session = next(get_db())
        try:
            # 这里实现实际的分析逻辑
            # 模拟分析过程
            import time
            time.sleep(5)  # 模拟耗时操作
            logger.info(f"Analyzing job in schedule thread for {job.job_id}...")

            # 更新分析结果
            update_job_analysis_status(
                db=db,
                job_id=job.job_id,
                domain_id=job.domain_id,
                status=models.JobAnalysisStatus.COMPLETED,
                root_cause="Root cause analysis completed",
                suggestions="Suggested solutions based on analysis"
            )
            db.commit()
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

job_analysis_service = JobAnalysisService()